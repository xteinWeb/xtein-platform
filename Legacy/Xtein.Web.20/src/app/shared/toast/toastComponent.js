import notify from 'devextreme/ui/notify';

export function showToast(message, type) {
  const container = document.getElementById('router-container');
  notify({
    message: message,
    width: 300,
    position: {
      at: 'bottom center',
      my: 'bottom center',
      of: container
    },
    animation: {
      show: { type: 'fade', duration: 400, from: 0, to: 1 },
      hide: { type: 'fade', duration: 40, to: 0 }
    },
  },
  type, 4500 );
}