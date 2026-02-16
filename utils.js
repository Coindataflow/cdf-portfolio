export function myDebounce(cb, ms) {
  let timer;
  return function doDebounce(...args) {
    var context = this;
    var args = arguments;
    clearTimeout(timer);
    timer = setTimeout(() => cb.apply(context, args), ms);
  };
}
