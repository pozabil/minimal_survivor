export const freeGame = {
  register(sceneManager, pipeline) {
    const { update, rUpdate, render } = pipeline;

    sceneManager.register("freeGame", {
      enter() {},
      update(dt) {
        update(dt);
      },
      rUpdate(dtRaw) {
        rUpdate(dtRaw);
      },
      render() {
        render();
      },
      exit() {},
    });
  },
};
