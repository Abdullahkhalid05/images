
import * as THREE from 'three';
import gsap from 'gsap';
import thumb6 from './thum.png';
import thumb7 from './thum7.png';
import thumb8 from './thum5.jpg';
import thumb9 from './thum9.jpg';
import thumb from './thum.png';
import thumnail from './thumbnail.jpg';
import tum from './tum.jpeg';

// Basic setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('slider-container').appendChild(renderer.domElement);

const loadingManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadingManager);

const imageSets = [
    [thumb6, thumb7, thumb8], // Set 1 for btn1
    [thumb9, thumb, thumnail], // Set 2 for btn2
    [tum, thumb7, thumb9], // Set 3 for btn3
    [thumb8, thumnail, tum], // Set 4 for btn4
    [tum, tum, tum], // Set 5 for btn5
];

let images = [];
let currentIndex = 0;
const imageDistance = 120;
let lastScrollPos = 0;
let isSliding = false; // To prevent multiple slides

function loadImages(setIndex) {
    const textures = imageSets[setIndex].map((img) => loader.load(img));
    loadingManager.onLoad = () => {
        console.log(`Image set ${setIndex + 1} loaded`);
        initializeImages(textures);
    };
}

function createImagePlane(texture) {
    const aspectRatio = texture.image.width / texture.image.height;
    const planeWidth = aspectRatio * 10; // Adjust the multiplier as needed
    const planeHeight = 10;

    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
    const material = new THREE.MeshBasicMaterial({ map: texture });
    return new THREE.Mesh(geometry, material);
}

function initializeImages(textures) {
    // Clear previous images from the scene
    images.forEach(image => scene.remove(image));
    images = [];

    textures.forEach((texture) => {
        const image = createImagePlane(texture);
        images.push(image);
    });

    // Initial positions for images
    images.forEach((image, index) => {
        image.position.set(index * imageDistance, 0, 0);
        scene.add(image);
    });

    currentIndex = 0;
    camera.position.z = 10;
    updateVisibleImages();
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function slideImages(direction) {
    if (isSliding) return; // Prevent multiple slides

    isSliding = true;
    const currentImage = images[currentIndex];
    const nextIndex = (currentIndex + direction);

    if (nextIndex >= 0 && nextIndex < images.length) {
        const nextImage = images[nextIndex];

        // Apply rotation based on direction
        const rotationAngle = direction * Math.PI / 6; // 30 degrees per slide

        gsap.to(currentImage.position, { x: direction * -imageDistance, duration: 1 });
        gsap.to(currentImage.rotation, { y: rotationAngle, duration: 1 });

        nextImage.position.x = direction * imageDistance;
        gsap.to(nextImage.position, { x: 0, duration: 1 });
        gsap.to(nextImage.rotation, { y: 0, duration: 1 });

        currentIndex = nextIndex;
        updateVisibleImages();

        // Allow sliding after animations complete
        gsap.delayedCall(1, () => isSliding = false);
    } else {
        isSliding = false; // Allow sliding if out of bounds
    }
}

function updateVisibleImages() {
    const visibleRange = 3;
    const offset = Math.floor(visibleRange / 2);
    const minIndex = Math.max(0, currentIndex - offset);
    const maxIndex = Math.min(images.length - 1, currentIndex + offset);

    images.forEach((image, index) => {
        if (index < minIndex || index > maxIndex) {
            if (scene.children.includes(image)) {
                scene.remove(image);
            }
        } else if (!scene.children.includes(image)) {
            scene.add(image);
        }
    });
}

// Throttle function to limit scroll handling rate
function throttle(func, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}

// Scroll event handler with throttling and slower effect
const handleScroll = throttle((event) => {
    const direction = event.deltaX > 0 ? 1 : -1;

    // Scale the scroll amount to slow down the effect
    if (Math.abs(event.deltaX) > 100) { // Adjust this threshold as needed
        slideImages(direction);
    }
}, 100); // Adjust throttle delay as needed

window.addEventListener('wheel', handleScroll);

document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
        slideImages(-1);
    } else if (event.key === 'ArrowRight') {
        slideImages(1);
    }
});

document.querySelectorAll('button').forEach((button, index) => {
    button.addEventListener('click', () => loadImages(index));
});

scene.background = new THREE.Color('white');
