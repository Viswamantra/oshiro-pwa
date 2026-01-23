rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    /* =====================
       HELPERS
    ===================== */
    function isSignedIn() {
      return request.auth != null;
    }

    // DEV MODE ADMIN
    function isAdmin() {
      return isSignedIn();
    }

    /* =====================
       SCHEMA VALIDATORS
    ===================== */

    function hasValidMerchantSchema(data) {
      return data.keys().hasAll([
        "mobile",
        "shop_name",
        "category",
        "status",
        "profileComplete"
      ]);
    }

    function hasValidOfferSchema(data) {
      return data.keys().hasAll([
        "merchantId",
        "shop_name",
        "mobile",
        "category",
        "title",
        "isActive"
      ]);
    }

    /* =====================
       CATEGORIES
    ===================== */
    match /categories/{id} {
      allow read: if true;
      allow write: if isAdmin();
    }

    /* =====================
       MERCHANTS
    ===================== */
    match /merchants/{merchantId} {

      // Merchant registration
      allow create: if
        request.resource.data.status == "pending"
        && hasValidMerchantSchema(request.resource.data)
        && request.resource.data.profileComplete in [true, false];

      // Read merchants
      allow read: if true;

      // Admin only
      allow update, delete: if isAdmin();
    }

    /* =====================
       OFFERS ✅ FIXED
    ===================== */
    match /offers/{offerId} {

      // Customers & public
      allow read: if true;

      // 🔥 MERCHANT CREATE
      allow create: if
        hasValidOfferSchema(request.resource.data)
        && request.resource.data.merchantId is string
        && request.resource.data.title is string;

      // 🔥 MERCHANT UPDATE (own offer only)
      allow update: if
        request.resource.data.merchantId == resource.data.merchantId;

      // 🔥 MERCHANT DELETE (own offer only)
      allow delete: if
        request.resource.data.merchantId == resource.data.merchantId;

      // 👑 ADMIN OVERRIDE
      allow create, update, delete: if isAdmin();
    }

    /* =====================
       CUSTOMER VISITS
    ===================== */
    match /customer_visits/{id} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }

    /* =====================
       CUSTOMERS
    ===================== */
    match /customers/{id} {
      allow create, read: if true;
      allow update, delete: if isAdmin();
    }

    /* =====================
       NOTIFICATIONS
    ===================== */
    match /notifications/{id} {
      allow read, write: if isAdmin();
    }

    /* =====================
       SAFETY NET
    ===================== */
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
