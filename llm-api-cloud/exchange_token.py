import requests

APP_ID = "766351669136745"
APP_SECRET = "252e37e8f18bc73766325bd4689cbb8d"
# This is the token the user just gave me (Page Token)
# Note: To get a long-lived PAGE token, we usually:
# 1. Exchange User Token -> Long-Lived User Token
# 2. Use Long-Lived User Token to get Long-Lived Page Token.
# However, if this IS a Page Token, exchanging it directly might work if it's not already expired.
# Let's try exchanging it.
SHORT_LIVED_TOKEN = "EAAK4ZCicDDWkBQSJMIQkwBGtoMWqueBifBMPHsx3vdcyAgDwvZBrXZAXWYzFoWZBErg8tx4sIosEOaZA4os9XZANEvLxj3kotCDRnYKV4PuOGzZACBmVNrGUAAMpmRVMxVDGqATWdrNsVSggGAs7yjjjdZAgEJroygAszdtDhUPIQI9LI8GMByNTT8v19YD1nKbkwZBmS6FZB5YWL8PHmJn5ZAGxSKDsZCyOoxEe"

def get_long_lived_token():
    url = "https://graph.facebook.com/v19.0/oauth/access_token"
    params = {
        "grant_type": "fb_exchange_token",
        "client_id": APP_ID,
        "client_secret": APP_SECRET,
        "fb_exchange_token": SHORT_LIVED_TOKEN
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if "access_token" in data:
        print(f"LONG_LIVED_TOKEN={data['access_token']}")
    else:
        print(f"Error: {data}")

if __name__ == "__main__":
    get_long_lived_token()
