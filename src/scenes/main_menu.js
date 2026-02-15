export const mainMenu = {
  register(sceneManager, main) {
    const { menus } = main;

    sceneManager.register("mainMenu", {
      enter() { menus.openMainMenu(); },
      update() {},
      rUpdate() {},
      render() {},
      exit() {},
    });
  },
};
