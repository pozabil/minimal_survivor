export const freeGame = {
  register(sceneManager, pipeline, main) {
    const { update, rUpdate, render } = pipeline;
    const { menus } = main;

    sceneManager.register("freeGame", {
      enter() {
        menus.enterGameplayUi();
      },
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
