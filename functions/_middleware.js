export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname === 'reiblast.f5.si') {
    url.hostname = 'reiblast1123.com';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
