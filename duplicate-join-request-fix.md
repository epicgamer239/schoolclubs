# Duplicate Join Request Fix

## **🐛 Problem Identified:**

When a school is set to manual approval and a student refreshes the page while waiting for approval, they could create multiple join requests by:

1. **Submitting join code** → Creates join request
2. **Refreshing page** → Still on `/signup/role` page  
3. **Submitting join code again** → Creates **another** join request
4. **No duplicate checking** → Multiple requests created

## **✅ Fix Implemented:**

### **1. User Role Check:**
```javascript
// Check if user already has a role assigned (prevents duplicate requests)
const userDoc = await getDoc(doc(firestore, "users", user.uid));
if (userDoc.exists() && userDoc.data().role) {
  setError("You already have an account. Please sign in instead.");
  return;
}
```

### **2. Existing Request Check:**
```javascript
// Check if a join request already exists for this user and school
const existingRequestQuery = query(
  collection(firestore, "schoolJoinRequests"),
  where("studentId", "==", user.uid),
  where("schoolId", "==", schoolId),
  where("status", "==", "pending")
);
const existingRequestSnapshot = await getDocs(existingRequestQuery);

if (!existingRequestSnapshot.empty) {
  // Join request already exists
  setSuccess(`You already have a pending request to join ${schoolData.name} as a ${role}. Please wait for administrator approval.`);
  return;
}
```

### **3. Loading State Prevention:**
```javascript
const [loading, setLoading] = useState(false);

// In handleJoinCodeSubmit:
setLoading(true);
try {
  // ... join logic
} finally {
  setLoading(false);
}

// In UI:
<button disabled={loading}>
  {loading ? "Joining..." : "Join School"}
</button>
```

## **🎯 Benefits:**

✅ **Prevents Duplicate Requests**: Checks for existing requests before creating new ones
✅ **Better UX**: Shows helpful message if request already exists
✅ **Loading States**: Prevents rapid clicking
✅ **Role Protection**: Prevents users with existing roles from creating requests
✅ **Clear Feedback**: Users know their request status

## **🔍 How It Works:**

### **Scenario 1: First Time Request**
1. Student enters join code
2. System checks: No existing request found
3. Creates new join request
4. Shows success message

### **Scenario 2: Duplicate Attempt**
1. Student refreshes page and tries again
2. System checks: Existing request found
3. Shows message: "You already have a pending request..."
4. No new request created

### **Scenario 3: Already Approved**
1. Student tries to join again
2. System checks: User already has role
3. Shows message: "You already have an account..."
4. Redirects to login

## **📊 Database Queries:**

### **Check Existing Request:**
```javascript
query(
  collection(firestore, "schoolJoinRequests"),
  where("studentId", "==", user.uid),
  where("schoolId", "==", schoolId),
  where("status", "==", "pending")
)
```

### **Check User Role:**
```javascript
getDoc(doc(firestore, "users", user.uid))
```

## **🧪 Testing Scenarios:**

1. **Normal Flow**: Student submits join code → Request created
2. **Refresh & Retry**: Student refreshes and tries again → Shows existing request message
3. **Approved User**: Student with existing role tries to join → Shows account exists message
4. **Rapid Clicks**: Student clicks multiple times quickly → Loading state prevents duplicates

## **🛡️ Security Benefits:**

- **Prevents Spam**: No duplicate requests in admin dashboard
- **Data Integrity**: Clean join request collection
- **User Experience**: Clear feedback on request status
- **System Performance**: Fewer unnecessary database writes

The fix ensures that each student can only have one pending join request per school, preventing confusion for administrators and maintaining data integrity. 