<Route element={<ProtectedRoute adminOnly />}>
  <Route path="/admin" element={<AdminLayout />}>
    <Route index element={<Dashboard />} />
    <Route path="customers" element={<Customers />} />
    <Route path="merchants" element={<Merchants />} />
    <Route path="categories" element={<Categories />} />
    <Route path="offers" element={<Offers />} />
    <Route path="geo-alerts" element={<GeoAlerts />} />
    <Route path="notifications" element={<Notifications />} />
  </Route>
</Route>
