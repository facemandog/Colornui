// app.js
let scene, camera, renderer, model, controls;

init();
animate();

function init() {
  // Create scene
  scene = new THREE.Scene();
  
  // Create and position the camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);
  
  // Set up renderer with antialias for smoother edges
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  
  // Instantiate OrbitControls using THREE.OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  
  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
  
  // Add an AxesHelper for debugging
  const axesHelper = new THREE.AxesHelper(10);
  scene.add(axesHelper);
  
  // Add a GridHelper with custom colors
  const gridHelper = new THREE.GridHelper(20, 20, new THREE.Color(0x444444), new THREE.Color(0x888888));
  scene.add(gridHelper);
  
  // Load the glTF model using the updated path
  const loader = new THREE.GLTFLoader();
  loader.load(
    'assets/123.glb',
    function (gltf) {
      console.log("Model loaded successfully:", gltf);
      
      // Use gltf.scene (or gltf.scenes[0] if necessary)
      model = gltf.scene || (gltf.scenes && gltf.scenes[0]);
      if (!model || (model && model.children.length === 0)) {
        console.error("No valid model found in the glTF file.");
        return;
      }
      
      // Compute the bounding box in the model’s original space
      const box = new THREE.Box3().setFromObject(model);
      console.log("Original bounding box:", box);
      
      // Calculate a scale factor so that the model fits within a desirable size
      const sizeVector = box.getSize(new THREE.Vector3());
      const size = sizeVector.length();
      if (size === 0) {
        console.error("Invalid bounding box size.");
        return;
      }
      const scaleFactor = 10 / size;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      model.userData.baseScale = scaleFactor;
      
      // Adjust position so the model’s base (box.min.y) lands at y = 0 in world space
      model.position.y = -scaleFactor * box.min.y;
      console.log("Model repositioned. New y position:", model.position.y);
      
      scene.add(model);
      
      // Update OrbitControls target based on the model's new bounding box
      box.setFromObject(model); // recompute after scaling and positioning
      const center = box.getCenter(new THREE.Vector3());
      controls.target.copy(center);
      controls.update();
    },
    undefined,
    function (error) {
      console.error("Error loading model:", error);
    }
  );
  
  // Responsive canvas
  window.addEventListener('resize', onWindowResize, false);
  
  // Set up color controls
  document.getElementById('applyColor').addEventListener('click', () => {
    let hex = document.getElementById('colorInput').value;
    updateModelColor(hex);
  });
  
  document.querySelectorAll('.preset').forEach(button => {
    button.addEventListener('click', () => {
      let hex = button.getAttribute('data-color');
      updateModelColor(hex);
    });
  });
  
  // Set up scale slider
  document.getElementById('scaleSlider').addEventListener('input', (e) => {
    if (model) {
      const baseScale = model.userData.baseScale || 1;
      const scaleValue = parseFloat(e.target.value);
      model.scale.set(
        baseScale * scaleValue,
        baseScale * scaleValue,
        baseScale * scaleValue
      );
    }
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateModelColor(hex) {
  if (!model) return;
  const color = new THREE.Color(hex);
  model.traverse(child => {
    if (child.isMesh) {
      child.material.color.set(color);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  
  // Update orbit controls
  if (controls) controls.update();
  
  // Removed auto-rotation to let user control the model
  renderer.render(scene, camera);
}
