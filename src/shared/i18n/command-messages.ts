const en = {
  sending: 'Saving shipment…',
  closing: 'Closing this dialog does not cancel a request already sent.',
  uncertain:
    'The result is not confirmed. Retry this same request before making another change. Recovery is kept in this tab until logout or tab closure.',
  retry: 'Retry the same request',
  refreshError:
    'The change was saved, but the latest record could not be loaded. Refresh the view; do not submit it again.',
  refresh: 'Refresh saved record',
  conflict:
    'This shipment changed after you opened it. Your values are preserved. Review the current record before saving again.',
  denied:
    'Your session or account cannot make this change. Check your account and administrator verification.',
  unavailable: 'This shipment is unavailable or you do not have permission to change it.',
  validation: 'The change was rejected. Check the fields and completion time, then try again.',
  idempotency:
    'This request key was already used for different values. The change was not applied; reload and review the record.',
  storage:
    'Safe local request recovery is unavailable. No new request will be sent. Check browser storage and reload.',
  review: 'Review latest version',
  rebase: 'Keep my values for this revision',
  reviewHelp:
    'Compare the latest saved values below. Keeping your values prepares a new save; it does not save automatically.',
  ready: 'Latest revision selected. Review your values, then save when ready.',
  revision: 'Revision',
  busy: 'Finish or resolve the outstanding request first.',
  saved: 'Change saved.',
  dismiss: 'Dismiss message',
  fieldsPreserved: 'Your unsaved values are preserved in this tab for this account.',
  restoreHelp:
    'Restore this shipment to the active register? Its original owner, number, start time and audit history will be retained.',
  completionHelp:
    'Enter the actual completion date and time in Riyadh. The server validates the time before saving.',
  clockLoading: 'Checking the current server time…',
  clockError: 'Current time could not be verified. Check the connection and retry.',
  retryClock: 'Check time again',
  emptyTitle: 'Your shipment workspace is ready',
  emptyHelp: 'Register a shipment to start tracking its route, driver and delivery status.',
  filteredEmpty: 'No shipments match these filters',
  filteredHelp:
    'Try another search or clear the filters. Only records authorized for your account are shown.',
  deletedEmpty: 'No deleted shipments',
  deletedHelp:
    'Shipments moved to deleted records will appear here for administrator review and restoration.',
}
type CommandMessages = { [K in keyof typeof en]: string }
const ar: CommandMessages = {
  sending: 'جارٍ حفظ الشحنة…',
  closing: 'إغلاق هذه النافذة لا يلغي طلباً تم إرساله بالفعل.',
  uncertain:
    'لم يتم تأكيد نتيجة الطلب. أعد محاولة الطلب نفسه قبل إجراء تغيير آخر. تُحفظ معلومات الاسترداد في هذا التبويب حتى تسجيل الخروج أو إغلاقه.',
  retry: 'إعادة محاولة الطلب نفسه',
  refreshError: 'تم حفظ التغيير، ولكن تعذر تحميل أحدث سجل. حدّث العرض ولا ترسل الطلب مجدداً.',
  refresh: 'تحديث السجل المحفوظ',
  conflict: 'تغيرت الشحنة بعد فتحها. تم الاحتفاظ بقيمك. راجع السجل الحالي قبل الحفظ مجدداً.',
  denied:
    'لا تملك جلستك أو حسابك صلاحية إجراء هذا التغيير. تحقق من الحساب والتحقق بخطوتين للمسؤول.',
  unavailable: 'الشحنة غير متاحة أو لا تملك صلاحية تعديلها.',
  validation: 'تم رفض التغيير. تحقق من الحقول ووقت الإكمال ثم أعد المحاولة.',
  idempotency: 'استُخدم معرّف الطلب نفسه لقيم مختلفة. لم يُطبّق التغيير؛ أعد تحميل السجل وراجعه.',
  storage:
    'تعذر توفير استرداد آمن للطلب محلياً. لن يُرسل طلب جديد. تحقق من تخزين المتصفح ثم أعد التحميل.',
  review: 'مراجعة أحدث إصدار',
  rebase: 'الاحتفاظ بقيمي لهذا الإصدار',
  reviewHelp:
    'قارن القيم المحفوظة الحالية أدناه. الاحتفاظ بقيمك يجهز حفظاً جديداً ولا يحفظ تلقائياً.',
  ready: 'تم اختيار أحدث إصدار. راجع قيمك ثم احفظ عندما تكون مستعداً.',
  revision: 'الإصدار',
  busy: 'أكمل الطلب المعلّق أو تحقق من نتيجته أولاً.',
  saved: 'تم حفظ التغيير.',
  dismiss: 'إغلاق الرسالة',
  fieldsPreserved: 'يُحتفظ بقيمك غير المحفوظة في علامة التبويب هذه لهذا الحساب.',
  restoreHelp:
    'هل تريد استعادة الشحنة إلى السجلات النشطة؟ سيُحتفظ بالمالك والرقم ووقت البدء الأصلي وسجل التغييرات.',
  completionHelp: 'أدخل تاريخ ووقت الإكمال الفعلي بتوقيت الرياض. يتحقق الخادم من الوقت قبل الحفظ.',
  clockLoading: 'جارٍ التحقق من الوقت الحالي للخادم…',
  clockError: 'تعذر التحقق من الوقت الحالي. تحقق من الاتصال وأعد المحاولة.',
  retryClock: 'التحقق من الوقت مجدداً',
  emptyTitle: 'مساحة شحناتك جاهزة',
  emptyHelp: 'سجّل شحنة لبدء متابعة مسارها وسائقها وحالة تسليمها.',
  filteredEmpty: 'لا توجد شحنات تطابق عوامل التصفية',
  filteredHelp: 'جرّب بحثاً آخر أو امسح عوامل التصفية. تظهر السجلات المصرح بها لحسابك فقط.',
  deletedEmpty: 'لا توجد شحنات محذوفة',
  deletedHelp: 'ستظهر الشحنات المنقولة إلى السجلات المحذوفة هنا لمراجعتها واستعادتها من المسؤول.',
}
export const commandMessages = { en, ar }
