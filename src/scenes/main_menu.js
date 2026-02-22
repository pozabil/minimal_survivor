export const mainMenu = {
  register(sceneManager, main) {
    const { menus } = main;

    sceneManager.register("mainMenu", {
      enter() { menus.enterMainMenuUi(); },
      update() {},
      rUpdate() {},
      render() {},
      exit() {},
    });
  },
};
