import time
import datetime
import boto3
import botocore.exceptions

def on_event(event, context):
  print(event)
  request_type = event['RequestType']
  if request_type == 'Create': return on_create(event)
  if request_type == 'Update': return on_update(event)
  if request_type == 'Delete': return on_delete(event)
  if request_type == 'IsComplete': return is_complete(event, context)
  raise Exception("Invalid request type: %s" % request_type)

def on_create(event):
  props = event["ResourceProperties"]
  print("create new resource with props %s" % props)
  return {}

def on_update(event):
  physical_id = event["PhysicalResourceId"]
  props = event["ResourceProperties"]
  print("update resource %s with props %s" % (physical_id, props))
  return {}

def on_delete(event):
  physical_id = event["PhysicalResourceId"]
  print("delete resource %s" % physical_id)
  return {}
  
def is_complete(event, context):
    if event['RequestType'] == "Delete":
        return { 'IsComplete': True }
    resource_props = event["ResourceProperties"]
    stackset_name = resource_props["stackSetName"]
    print(f"Checking for {resource_props['stackSetName']} stackset instance success")
    client = boto3.client('cloudformation')
    is_ready = False
    for i in range(17): #4 min and 15 seconds
        try:
            stack_instances = client.list_stack_instances(StackSetName=stackset_name,CallAs="DELEGATED_ADMIN")
            all_complete = True
            for i in stack_instances["Summaries"]:
                if i["Status"] == "CURRENT":
                    if i["StackInstanceStatus"]["DetailedStatus"] == "SUCCEEDED":
                        print(f"Stack Success: {i['StackId']}")
                        pass
                    elif i["StackInstanceStatus"]["DetailedStatus"] == "FAILED":
                        all_complete = False
                        print(f"Stack Fail: {i['StackId']}")
                        raise Exception(f"A stack instance failed to deploy: {i}")
                    else:
                        all_complete = False
                        break
                elif i["Status"] == "OUTDATED":
                    if i["StackInstanceStatus"]["DetailedStatus"] == "FAILED":
                        all_complete = False
                        print(f"Stack Fail: {i['StackId']}")
                        raise Exception(f"A stack instance failed to deploy: {i}")
                    else:
                        all_complete = False
                        break
                elif i["Status"] == "INOPERABLE":
                    all_complete = False
                    raise Exception(f"A stack instance has become inoperable: {i}")
                else:
                    print(f"Unknown stack status:{i['Status']} in stack ID: {i['StackId']}") 
                    all_complete = False
                    break
            if all_complete:
                is_ready = True
                print("Stackset is ready")
                break   
        except client.exceptions.StackSetNotFoundException:  
            # this means the stack set is not yet propagated, hurry up and wait.
            pass
        except Exception as e:
            raise e
        time.sleep(15)
    return { 'IsComplete': is_ready }

   