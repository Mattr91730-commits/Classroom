# Auth Testing Playbook (Emergent Google Auth)

## Step 1: Create Test Teacher Session in Mongo
```bash
mongosh --eval "
use('test_database');
var userId = 'user_test123';
var sessionToken = 'test_session_classbank';
db.teachers.insertOne({
  user_id: userId,
  email: 'teacher.test@example.com',
  name: 'Test Teacher',
  picture: '',
  classroom_username: 'mrsmith',
  classroom_name: 'Mrs. Smith Class',
  currency_symbol: '\$',
  created_at: new Date()
});
db.sessions.insertOne({
  user_id: userId,
  session_token: sessionToken,
  expires_at: new Date(Date.now() + 7*24*60*60*1000),
  created_at: new Date()
});
"
```

## Step 2: Backend Curl Test
```bash
curl -X GET "$REACT_APP_BACKEND_URL/api/auth/me" \
  -H "Authorization: Bearer test_session_classbank"
```

## Step 3: Browser Cookie
```python
await page.context.add_cookies([{
    "name": "session_token",
    "value": "test_session_classbank",
    "domain": "<host>",
    "path": "/",
    "httpOnly": True,
    "secure": True,
    "sameSite": "None"
}])
```

## Student Auth Test
```bash
curl -X POST "$REACT_APP_BACKEND_URL/api/auth/student/login" \
  -H "Content-Type: application/json" \
  -d '{"classroom_username":"mrsmith","student_id":"<id>","pin":"1234"}'
```
