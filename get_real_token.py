import requests

ACCESS_TOKEN = "EAAK4ZCicDDWkBQVgXbtnkIpfgvUYJ3Kt22SiRKtuK8Tmn2GVlNvhBfHDQKFY0CVwcSam8DpgK6qkN4IXs8viU4RVhkSFZBKoghneRTzq2Pm0MJRhMnZAelY7MojOmo9UPqg4hVTkng6cf8p1sKaSmhv0vnFJpCBb2b4PAd3ZANlRfhOstVPOas0L2wru"
CORRECT_PAGE_ID = "982517748269234"

def get_real_token():
    url = f"https://graph.facebook.com/v19.0/me/accounts?access_token={ACCESS_TOKEN}"
    r = requests.get(url).json()
    if 'data' in r:
        for page in r['data']:
            if page['id'] == CORRECT_PAGE_ID:
                print(f"NEW_PAGE_TOKEN={page['access_token']}")
                return

if __name__ == "__main__":
    get_real_token()
