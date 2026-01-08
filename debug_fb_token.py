import requests
import os
import json

# Inputs (from .env or hardcoded for debug)
ACCESS_TOKEN = "EAAK4ZCicDDWkBQVgXbtnkIpfgvUYJ3Kt22SiRKtuK8Tmn2GVlNvhBfHDQKFY0CVwcSam8DpgK6qkN4IXs8viU4RVhkSFZBKoghneRTzq2Pm0MJRhMnZAelY7MojOmo9UPqg4hVTkng6cf8p1sKaSmhv0vnFJpCBb2b4PAd3ZANlRfhOstVPOas0L2wru"
PAGE_ID = "61585831636993"
APP_ID = "766351669136745"
APP_SECRET = "252e37e8f18bc73766325bd4689cbb8d"

def debug_token():
    print(f"--- DEBUGGING TOKEN: {ACCESS_TOKEN[:10]}... ---")
    
    # 1. Inspect Token
    url = f"https://graph.facebook.com/debug_token?input_token={ACCESS_TOKEN}&access_token={ACCESS_TOKEN}"
    try:
        r = requests.get(url).json()
        if 'data' in r:
            print(f"Type: {r['data'].get('type')}")
            print(f"Valid: {r['data'].get('is_valid')}")
            print(f"Scopes: {r['data'].get('scopes')}")
            print(f"User ID: {r['data'].get('user_id')}")
            
            # Check if it matches Page ID
            if r['data'].get('type') == 'PAGE':
                print("✅ Token is a PAGE token.")
            else:
                print("⚠️  Token is a USER token (Requires exchange for Page Token).")
        else:
            print(f"Error inspecting token: {r}")
    except Exception as e:
        print(f"Exception inspecting token: {e}")

    # 2. Check Page Info
    print(f"\n--- CHECKING PAGE ID: {PAGE_ID} ---")
    url = f"https://graph.facebook.com/v19.0/{PAGE_ID}?fields=name,category,access_token&access_token={ACCESS_TOKEN}"
    try:
        r = requests.get(url).json()
        print(f"Page Name: {r.get('name')}")
        print(f"Page access available? {'access_token' in r}")
        
        if 'access_token' in r:
             print(f"🔥🔥 FOUND REAL PAGE TOKEN: {r['access_token'][:20]}...")
             return r['access_token']
        elif 'error' in r:
             print(f"Error accessing page: {r['error']['message']}")
    except Exception as e:
         print(f"Exception checking page: {e}")

    # 3. List User Accounts (Backup plan)
    print(f"\n--- LISTING USER ACCOUNTS ---")
    url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={ACCESS_TOKEN}"
    try:
        r = requests.get(url).json()
        if 'data' in r:
            for page in r['data']:
                print(f"Found Page: {page['name']} (ID: {page['id']})")
                if page['id'] == PAGE_ID:
                    print(f"✅ MATCH FOUND! Real Page Token: {page['access_token'][:20]}...")
                    return page['access_token']
    except Exception as e:
        print(f"Exception listing accounts: {e}")

if __name__ == "__main__":
    new_token = debug_token()
    if new_token:
        print(f"\n\n!!! SAVE THIS NEW TOKEN !!!\n{new_token}")
