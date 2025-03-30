// app.js
let scene, camera, renderer, model, controls;
let ambientLight, directionalLight;

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
  // Adjusted camera position for a better view of the model and plane
  camera.position.set(0, 5, 10);
  
  // Set up renderer with antialias enabled
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canvas'),
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 1);
  
  // Instantiate OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  
  // Add preset lights
  ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // preset intensity
  scene.add(ambientLight);
  
  directionalLight = new THREE.DirectionalLight(0xffffff, 1); // preset intensity
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);
  
  // Add a grey plane below the object
  const planeGeometry = new THREE.PlaneGeometry(100, 100);
  const planeMaterial = new THREE.MeshStandardMaterial({ color: 0x808080 });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = -Math.PI / 2; // make it horizontal
  plane.position.y = 0;
  scene.add(plane);
  
  // Load the glTF model
  const loader = new THREE.GLTFLoader();
  loader.load(
    'assets/123.glb',
    function (gltf) {
      console.log("Model loaded successfully:", gltf);
      
      // Use gltf.scene or fallback to gltf.scenes[0]
      model = gltf.scene || (gltf.scenes && gltf.scenes[0]);
      if (!model || (model && model.children.length === 0)) {
        console.error("No valid model found in the glTF file.");
        return;
      }
      
      // Compute bounding box for model scaling and positioning
      const box = new THREE.Box3().setFromObject(model);
      console.log("Original bounding box:", box);
      const sizeVector = box.getSize(new THREE.Vector3());
      const size = sizeVector.length();
      if (size === 0) {
        console.error("Invalid bounding box size.");
        return;
      }
      const scaleFactor = 10 / size;
      model.scale.set(scaleFactor, scaleFactor, scaleFactor);
      model.userData.baseScale = scaleFactor;
      
      // Position model so its base touches y=0 (taking scaling into account)
      model.position.y = -scaleFactor * box.min.y;
      console.log("Model repositioned. New y position:", model.position.y);
      
      scene.add(model);
      
      // Update OrbitControls target based on the model's bounding box
      box.setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      controls.target.copy(center);
      controls.update();
    },
    undefined,
    function (error) {
      console.error("Error loading model:", error);
    }
  );
  
  // Set up extra lighting control event listeners
  document.getElementById('ambientIntensity').addEventListener('input', (e) => {
    ambientLight.intensity = parseFloat(e.target.value);
  });
  document.getElementById('directionalIntensity').addEventListener('input', (e) => {
    directionalLight.intensity = parseFloat(e.target.value);
  });
  
  // Set up color controls
  document.getElementById('applyColor').addEventListener('click', () => {
    let hex = document.getElementById('colorInput').value;
    updateModelColor(hex);
  });
  document.getElementById('colorSelect').addEventListener('change', (e) => {
    let hex = e.target.value;
    updateModelColor(hex);
  });
  
  // Set up scale slider control
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
  
  // Handle window resize events
  window.addEventListener('resize', onWindowResize, false);
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
  if (controls) controls.update();
  renderer.render(scene, camera);
}
