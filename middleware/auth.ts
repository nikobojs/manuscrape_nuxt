export default defineNuxtRouteMiddleware((to, from) => {
  console.log('From auth middleware');
});