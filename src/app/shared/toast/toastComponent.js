import notify from 'devextreme/ui/notify';

export function showToast(message, type) {

    const container = document.getElementById('router-container');

    notify({
        message,
        width: 340,

        position: {
            my: 'top right',
            at: 'top right',
            of: container,
            offset: '-20 20'
        },

        animation: {
            show: {
                type: 'slide',
                from: { opacity: 0, top: -30 },
                to: { opacity: 1, top: 0 },
                duration: 220
            },
            hide: {
                type: 'fade',
                duration: 180,
                to: 0
            }
        }

    }, type, 4500);

}