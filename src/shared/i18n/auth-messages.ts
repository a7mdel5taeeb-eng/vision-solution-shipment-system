export const authEnglish = {
  accountChecking: 'Checking your account permissions…',
  accountUnavailable: 'Account access unavailable',
  accountLookupError:
    'Your account permissions could not be verified. Refresh your session to try again.',
  accountInactive:
    'This account is inactive. Contact your local operator; signing in does not reactivate an account.',
  accountUnauthorized:
    'This identity has no authorized application account. Contact your local operator.',
  accountAdminTitle: 'Administrator workspace',
  accountEmployeeTitle: 'Employee workspace',
  accountName: 'Profile name',
  accountRole: 'Authorized role',
  accountAdmin: 'Administrator',
  accountEmployee: 'Employee',
  accountEmployeeReady: 'Your employee account is authorized.',
  accountMfaPassed: 'Administrator account verified with two-factor authentication.',
  accountScope:
    'Account security is ready. Connected shipment lists and actions will follow in the next approved milestones. Demo Mode remains available.',
  accountMfaEnroll: 'Protect your administrator account',
  accountMfaVerify: 'Verify with your authenticator',
  accountMfaHelp:
    'Administrator access requires a current six-digit code from your authenticator app. Password-only sessions cannot access operational data.',
  accountMfaStart: 'Set up authenticator',
  accountMfaUnfinished:
    'An unfinished setup already exists. Complete it in the original tab, or ask the local operator to review it. Existing factors have been preserved.',
  accountMfaQr: 'Scan this private QR code with your authenticator app',
  accountMfaManual: 'Manual setup key',
  accountMfaPrivate:
    'Keep this setup key private. It is shown only during enrollment and is not saved by this page. Complete setup in this tab; existing factors are never removed automatically.',
  accountMfaCode: 'Six-digit verification code',
  accountMfaConfirm: 'Verify code',
  accountMfaChecking: 'Verifying code…',
  accountMfaError:
    'Authenticator setup or verification failed. Check the current code and your device clock, then try again. Refresh the session if setup could not load.',
  accountMfaFactor: 'Authenticator',
  accountRecovery:
    'Lost your authenticator? Contact the trusted local operator. Self-service MFA removal and recovery bypasses are unavailable in this milestone.',
  authMode: 'Local connected mode',
  authLoginTitle: 'Sign in to your account',
  authLoginDescription:
    'Use your fictional local test account. Your demo workspace stays separate.',
  authEmail: 'Email address',
  authPasswordLabel: 'Password',
  authSignIn: 'Sign in',
  authSigningIn: 'Signing in…',
  authSignOut: 'Sign out',
  authChecking: 'Verifying your session…',
  authSigningOut: 'Signing out…',
  authRefresh: 'Refresh session',
  authRetry: 'Try again',
  authDemo: 'Open Demo Mode',
  authDemoHelp:
    'Demo opens separately. Signing in never changes demo accounts or shipment records.',
  authCredentials: 'The email or password is incorrect. Check both and try again.',
  authProvider:
    'Email/password sign-in is disabled in the local Auth service. The local operator must enable it before you can sign in.',
  authNetwork:
    'The local authentication service could not be reached. Check that it is running, then try again.',
  authExpired: 'Your session could not be verified or has expired. Sign in again.',
  authLogout:
    'Local sign-out could not be fully confirmed. Close this connected preview if the problem continues.',
  authConfigTitle: 'Local connection is not configured',
  authConfigDescription:
    'Start the separate connected preview with the local API URL and public client key. Demo Mode is still available.',
  authConfigHelp:
    'See docs/phase-3c1-auth-sessions.md for local setup. Do not enter service-role keys or company credentials.',
  authSessionTitle: 'You are signed in',
  authSessionDescription: 'Your local Supabase session has been verified.',
  authAccount: 'Signed-in account',
  authSessionUntil: 'Access token expires',
  authScopeTitle: 'Shipment connection comes next',
  authScopeDescription:
    'This milestone verifies sign-in and sessions only. Shipment operations and administrator access are not enabled in Connected Mode. Use Demo Mode for the existing workflows.',
}
export const authArabic: { [K in keyof typeof authEnglish]: string } = {
  accountChecking: 'جارٍ التحقق من صلاحيات حسابك…',
  accountUnavailable: 'الوصول إلى الحساب غير متاح',
  accountLookupError: 'تعذّر التحقق من صلاحيات حسابك. حدّث الجلسة للمحاولة مجدداً.',
  accountInactive: 'هذا الحساب غير نشط. تواصل مع المشغّل المحلي؛ تسجيل الدخول لا يعيد تفعيله.',
  accountUnauthorized: 'لا يوجد حساب تطبيق مصرّح به لهذه الهوية. تواصل مع المشغّل المحلي.',
  accountAdminTitle: 'مساحة عمل المدير',
  accountEmployeeTitle: 'مساحة عمل الموظف',
  accountName: 'اسم الملف الشخصي',
  accountRole: 'الدور المصرّح به',
  accountAdmin: 'مدير',
  accountEmployee: 'موظف',
  accountEmployeeReady: 'تم التحقق من صلاحية حساب الموظف.',
  accountMfaPassed: 'تم التحقق من حساب المدير بالمصادقة الثنائية.',
  accountScope:
    'أمان الحساب جاهز. ستُربط قوائم الشحنات وإجراءاتها في المراحل التالية بعد اعتمادها. يبقى الوضع التجريبي متاحاً.',
  accountMfaEnroll: 'احمِ حساب المدير',
  accountMfaVerify: 'تحقّق باستخدام تطبيق المصادقة',
  accountMfaHelp:
    'يتطلب وصول المدير رمزاً حالياً من ستة أرقام من تطبيق المصادقة. الجلسات المعتمدة على كلمة المرور فقط لا تصل إلى البيانات التشغيلية.',
  accountMfaStart: 'إعداد تطبيق المصادقة',
  accountMfaUnfinished:
    'يوجد إعداد غير مكتمل بالفعل. أكمله في علامة التبويب الأصلية، أو اطلب من المشغّل المحلي مراجعته. تم الاحتفاظ بعوامل المصادقة الحالية.',
  accountMfaQr: 'امسح رمز الاستجابة السريعة الخاص باستخدام تطبيق المصادقة',
  accountMfaManual: 'مفتاح الإعداد اليدوي',
  accountMfaPrivate:
    'احتفظ بمفتاح الإعداد سرياً. يظهر أثناء التسجيل فقط ولا تحفظه هذه الصفحة. أكمل الإعداد في هذه العلامة؛ لا تُزال عوامل المصادقة الحالية تلقائياً.',
  accountMfaCode: 'رمز التحقق من ستة أرقام',
  accountMfaConfirm: 'التحقق من الرمز',
  accountMfaChecking: 'جارٍ التحقق من الرمز…',
  accountMfaError:
    'تعذّر إعداد تطبيق المصادقة أو التحقق. تأكّد من الرمز الحالي وساعة جهازك ثم حاول مجدداً. حدّث الجلسة إذا تعذّر تحميل الإعداد.',
  accountMfaFactor: 'تطبيق المصادقة',
  accountRecovery:
    'فقدت تطبيق المصادقة؟ تواصل مع المشغّل المحلي الموثوق. إزالة المصادقة الذاتية وتجاوز الاسترداد غير متاحين في هذه المرحلة.',
  authMode: 'الوضع المحلي المتصل',
  authLoginTitle: 'تسجيل الدخول إلى حسابك',
  authLoginDescription: 'استخدم حساب الاختبار المحلي الوهمي. تبقى مساحة العمل التجريبية منفصلة.',
  authEmail: 'البريد الإلكتروني',
  authPasswordLabel: 'كلمة المرور',
  authSignIn: 'تسجيل الدخول',
  authSigningIn: 'جارٍ تسجيل الدخول…',
  authSignOut: 'تسجيل الخروج',
  authChecking: 'جارٍ التحقق من جلستك…',
  authSigningOut: 'جارٍ تسجيل الخروج…',
  authRefresh: 'تحديث الجلسة',
  authRetry: 'المحاولة مجدداً',
  authDemo: 'فتح الوضع التجريبي',
  authDemoHelp:
    'يفتح الوضع التجريبي بشكل منفصل. لا يغيّر تسجيل الدخول الحسابات أو سجلات الشحنات التجريبية.',
  authCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تحقّق منهما وحاول مجدداً.',
  authProvider:
    'تسجيل الدخول بالبريد وكلمة المرور معطّل في خدمة المصادقة المحلية. يجب على المشغّل المحلي تفعيله قبل تسجيل الدخول.',
  authNetwork: 'تعذّر الاتصال بخدمة المصادقة المحلية. تأكّد من تشغيلها ثم حاول مجدداً.',
  authExpired: 'تعذّر التحقق من جلستك أو انتهت صلاحيتها. سجّل الدخول مجدداً.',
  authLogout:
    'تعذّر تأكيد تسجيل الخروج المحلي بالكامل. أغلق هذه المعاينة المتصلة إذا استمرت المشكلة.',
  authConfigTitle: 'الاتصال المحلي غير مُعدّ',
  authConfigDescription:
    'شغّل المعاينة المتصلة المنفصلة بعنوان الواجهة المحلية ومفتاح العميل العام. يبقى الوضع التجريبي متاحاً.',
  authConfigHelp:
    'راجع docs/phase-3c1-auth-sessions.md لإعداد الاتصال المحلي. لا تدخل مفاتيح الخدمة المميّزة أو بيانات حسابات الشركة.',
  authSessionTitle: 'تم تسجيل دخولك',
  authSessionDescription: 'تم التحقق من جلسة Supabase المحلية الخاصة بك.',
  authAccount: 'الحساب المسجّل',
  authSessionUntil: 'انتهاء صلاحية رمز الوصول',
  authScopeTitle: 'ربط الشحنات في الخطوة القادمة',
  authScopeDescription:
    'تتحقق هذه المرحلة من تسجيل الدخول والجلسات فقط. إدارة الشحنات وصلاحيات المدير غير مفعّلة في الوضع المتصل. استخدم الوضع التجريبي لتجربة العمليات الحالية.',
}
