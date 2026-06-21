let addToastCallback = null;

export const triggerToast = (message, type = 'info', duration = 4000) => {
  if (addToastCallback) addToastCallback(message, type, duration);
};

export const setToastCallback = (cb) => {
  addToastCallback = cb;
};
