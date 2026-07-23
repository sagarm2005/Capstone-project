import urllib.request, json

url = 'http://127.0.0.1:5000/api/auth/login'
data = json.dumps({'email':'doctor@demo.com','password':'demo123'}).encode()
req = urllib.request.Request(url, data, headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req) as res:
    resp = json.load(res)
print('login', resp)
req2 = urllib.request.Request('http://127.0.0.1:5000/api/dashboard/doctor', headers={'Authorization': 'Bearer ' + resp['token']})
with urllib.request.urlopen(req2) as res2:
    print('dashboard', json.load(res2))
