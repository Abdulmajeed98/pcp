# The word list

**DRAFT, AWAITING REVIEW (LANG-7).** Nothing here has been read by a Sorani or an Arabic speaker yet.

The Kurdish (Sorani) and the Arabic word for each of the platform's terms that a Shopper or a Vendor reads, so that every screen uses the same word for the same thing. The terms are those of [CONTEXT.md](../../../../CONTEXT.md), where each is defined, the Categories are its eight, and the cities are those a Vendor may be in. The language files use these words, and a screen that shows a term for the first time takes its word from here. When the reviewer changes a word, it is changed here and in every file that uses it.

A word in _Notes_ that is marked **to choose** is one the drafter was least sure of. CONTEXT.md avoids some English words for a term, such as "seller" for a Vendor. That rule is for English, and the word here is the one a reader of the language would expect, even where it translates one of those English words.

## The platform's terms

| Term                  | Kurdish (Sorani)   | Arabic                   | Where a reader meets it | Notes                                                                                                   |
| --------------------- | ------------------ | ------------------------ | ----------------------- | ------------------------------------------------------------------------------------------------------- |
| Part                  | پارچە              | قطعة (plural: قطع)       | Both                    |                                                                                                         |
| Category              | پۆل                | فئة                      | Both                    | The eight are below.                                                                                    |
| Specification         | تایبەتمەندی        | مواصفة (plural: مواصفات) | Both                    |                                                                                                         |
| Part Request          | داواکاریی پارچە    | طلب قطعة                 | Vendor portal           |                                                                                                         |
| Admin                 | بەڕێوەبەر          | المسؤول                  | Vendor portal           | The Admin console itself is in English.                                                                 |
| Vendor                | فرۆشیار            | البائع                   | Both                    | Both mean "seller". **To choose**: Kurdish دوکاندار and Arabic التاجر name a shopkeeper and a merchant. |
| Offer                 | ئۆفەر              | عرض                      | Both                    | **To choose**: in a shop ئۆفەر often means a discount.                                                  |
| Confirmation          | پشتڕاستکردنەوە     | تأكيد                    | Both                    |                                                                                                         |
| Expired Offer         | ئۆفەری بەسەرچوو    | عرض منتهي الصلاحية        | Vendor portal           |                                                                                                         |
| Login                 | هەژمار             | حساب                     | Vendor portal           | The account. Logging in and out are below.                                                              |
| Log in                | چوونەژوورەوە       | تسجيل الدخول             | Vendor portal           |                                                                                                         |
| Log out               | چوونەدەرەوە        | تسجيل الخروج             | Vendor portal           |                                                                                                         |
| Login phone number    | ژمارەی تەلەفۆن     | رقم الهاتف               | Vendor portal           | "Phone number": Keycloak's login screen labels its field so, and its errors name it so.                 |
| Temporary password    | وشەی نهێنیی کاتی   | كلمة المرور المؤقتة      | Hand-over               | The WhatsApp message. "Password" is وشەی نهێنی, as Keycloak's screens in the theme say it.              |
| Caller                | بانگکەر            | المتصل                   | Vendor portal           | On the placeholder page only.                                                                           |
| Quoted Price          | نرخی دیاریکراو     | السعر المعلن             | Both                    |                                                                                                         |
| Converted Price       | نرخی گۆڕدراو       | السعر المحوَّل             | Shopper app             |                                                                                                         |
| Platform Rate         | نرخی دۆلاری پلاتفۆرم | سعر صرف المنصة           | Both                    |                                                                                                         |
| Shopper               | کڕیار              | المتسوّق                  | Shopper app             | Kurdish کڕیار means "buyer".                                                                            |
| Build                 | بیڵد               | تجميعة                   | Shopper app             | **To choose**: Kurdish بیڵد is the English word, as PC builders say it.                                 |
| Complete Build        | بیڵدی تەواو        | تجميعة مكتملة            | Shopper app             |                                                                                                         |
| Compatibility Rule    | یاسای گونجان       | قاعدة التوافق            | Shopper app             | On the Build page, as a rule that was not checked.                                                      |
| Compatibility Problem | کێشەی گونجان       | مشكلة توافق              | Shopper app             |                                                                                                         |
| Compatibility Warning | ئاگاداریی گونجان   | تحذير توافق              | Shopper app             |                                                                                                         |

Left out, because no Shopper or Vendor reads them: Specification list, Needed specification and Referral, which only the Admin console shows, in English.

## The platform's own names

| Name          | Kurdish (Sorani) | Arabic        |
| ------------- | ---------------- | ------------- |
| Shopper app   | ئەپی کڕیار       | تطبيق المتسوّق |
| Vendor portal | پۆرتاڵی فرۆشیار  | بوابة البائع  |

## The eight Categories

The shared terms, in `shared/`, hold these.

| Category    | Kurdish (Sorani)     | Arabic            |
| ----------- | -------------------- | ----------------- |
| CPU         | پرۆسێسەر             | المعالج           |
| CPU cooler  | ساردکەرەوەی پرۆسێسەر | مبرّد المعالج      |
| Motherboard | مازەربۆرد            | اللوحة الأم        |
| RAM         | ڕام                  | الذاكرة العشوائية |
| Storage     | بیرگەی هەڵگرتن       | التخزين           |
| GPU         | کارتی گرافیک         | بطاقة الرسومات    |
| Case        | کەیس                 | صندوق الحاسوب     |
| PSU         | پاوەر سەپلای          | مزوّد الطاقة       |

## The cities

The shared terms, in `shared/`, hold these, by the key the API names each by. A Vendor's city is one of a fixed set, which holds Erbil alone.

| City  | Key     | Kurdish (Sorani) | Arabic |
| ----- | ------- | ---------------- | ------ |
| Erbil | `erbil` | هەولێر           | أربيل  |
