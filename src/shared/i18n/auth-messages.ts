export const authEnglish = {
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
