# Route patch

Add this public verification route so client WhatsApp messages can open staff ID cards.

## If your App.tsx uses react-router-dom

```tsx
import PublicStaffIDCard from './pages/PublicStaffIDCard';

// Add outside ProtectedRoute/admin guard:
<Route path="/staff-id/:token" element={<PublicStaffIDCard />} />
```

## If your app has an admin-only route tree

Keep `/staff-id/:token` public. Do not put it inside the protected admin layout, otherwise clients cannot open the assigned staff ID card link from WhatsApp.

Recommended final route list:

```tsx
<Route path="/login" element={<LoginPage />} />
<Route path="/staff-id/:token" element={<PublicStaffIDCard />} />
<Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
  <Route index element={<Dashboard />} />
  <Route path="crm" element={<AICRM />} />
  <Route path="calls" element={<CallReviewInbox />} />
  <Route path="hr" element={<AIHR />} />
  <Route path="attendance" element={<ManualAttendance />} />
  <Route path="billing" element={<Finance />} />
  <Route path="settings" element={<AccessControl />} />
</Route>
```
