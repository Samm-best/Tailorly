// Route files may only export HTTP handlers, so shared serializers live here.
export const serializeAddress = (a: {
  _id: unknown; label: string; recipientName: string; phone?: string; line1: string; line2?: string;
  city: string; state: string; country: string; postalCode?: string; isDefault: boolean;
}) => ({
  id: String(a._id), label: a.label, recipientName: a.recipientName, phone: a.phone ?? "", line1: a.line1, line2: a.line2 ?? "",
  city: a.city, state: a.state, country: a.country, postalCode: a.postalCode ?? "", isDefault: a.isDefault,
});

