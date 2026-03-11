// simple authentication middleware stub - no external service.
// In the simplified flow we allow all socket connections and rely on the
// client to provide a username when joining a room.  `verifyAuth` exists so
// the io.use() call remains valid; it just calls `next()` immediately.
const verifyAuth = (socket, next) => {
    // nothing to verify
    next();
};

module.exports = {
    verifyAuth,
};
