import Header from "./components/Layout/Header/Header";

import SceneOne from "./scenes/SceneOne/SceneOne";
import SceneTwo from "./scenes/SceneTwo/SceneTwo";
import SceneThree from "./scenes/SceneThree/SceneThree";
import SceneFive from "./scenes/SceneFive/SceneFive";
import SceneSix from "./scenes/SceneSix/SceneSix";
import SceneContact from "./scenes/SceneContact/SceneContact";

function App() {
  return (
    <>
      <Header />

      <main>
        <SceneOne />
        <SceneTwo />
        <SceneThree />
        <SceneFive />
        <SceneSix />
        <SceneContact />
      </main>
    </>
  );
}

export default App;