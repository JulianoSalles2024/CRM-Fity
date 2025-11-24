// service-worker.js

self.addEventListener('push', (event) => {
  let data = { title: 'CRM', body: 'Você tem uma nova atualização.' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    // icon: '/logo.png', // You can add an icon file at the root later
    vibrate: [100, 50, 100],
    tag: 'fity-crm-notification',
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((clientList) => {
    if (clientList.length > 0) {
      let client = clientList[0];
      for (let i = 0; i < clientList.length; i++) {
        if (clientList[i].focused) {
          client = clientList[i];
        }
      }
      return client.focus();
    }
    return clients.openWindow('/');
  }));
});