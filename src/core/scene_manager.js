export function createSceneManager() {
  const scenes = new Map();

  let currentSceneId = "__boot__";
  let currentScene = {
    enter() {},
    exit() {},
    update() {},
    rUpdate() {},
    render() {},
  };

  function register(id, scene) {
    scenes.set(id, scene);
  }

  function setScene(id) {
    const prevScene = currentScene;
    currentSceneId = id;
    currentScene = scenes.get(id);
    prevScene.exit();
    currentScene.enter();
  }

  function update(dt) {
    currentScene.update(dt);
  }

  function rUpdate(dtRaw) {
    currentScene.rUpdate(dtRaw);
  }

  function render() {
    currentScene.render();
  }

  function getCurrentSceneId() {
    return currentSceneId;
  }

  return {
    register,
    setScene,
    update,
    rUpdate,
    render,
    getCurrentSceneId,
  };
}
