const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

document.body.style.userSelect = 'none'; // disables text selection
canvas.style.userSelect = 'none';        // more specific
canvas.style.webkitUserDrag = 'none';    // prevents image dragging on Safari/Chrome

let maxHeight = 500;
let showHelp = false;
let selectedImages = []; // array of selected image indices
let shiftHeld = false;

let lastResizeTime = 0;
const resizeThrottle = 16;

let offsetX, offsetY;
let images = []; // Array to store multiple images
let draggingResizer = -1;
let draggingImage = -1;
let activeImage = -1;  // Track the active (selected) image
let startX, startY;

let dragAll = false; // Toggle this when you want to drag all images
let prevX = 0;
let prevY = 0;

let readyToDrag = false;
let isDragging = false;
let lastSelectedForDot = null;


// CREATE RIGHT CLICK MENU
canvas.addEventListener('contextmenu', function (e) {
  e.preventDefault(); // Prevent the default context menu from showing

  const mouseX = e.clientX - offsetX;
  const mouseY = e.clientY - offsetY;

  // Determine which image was clicked on (if any)
  const clickedImageIndex = hitImage(mouseX, mouseY);
  if (clickedImageIndex !== -1) {
    activeImage = clickedImageIndex; // Set the clicked image as the active image

    // Show the custom context menu (implement the function below)
    showContextMenu(e.clientX, e.clientY, clickedImageIndex);
  }
});

function showContextMenu(x, y, clickedImageIndex) {
  const contextMenu = document.getElementById('contextMenu');
  
  // Get the menu dimensions
  const menuWidth = contextMenu.offsetWidth;
  const menuHeight = contextMenu.offsetHeight;

  // Adjust position to avoid overflow
  if (x + menuWidth > window.innerWidth) {
    x = window.innerWidth - menuWidth;
  }
  if (y + menuHeight > window.innerHeight) {
    y = window.innerHeight - menuHeight;
  }

  // Position the menu at the mouse click position
  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.style.display = 'block';


  document.getElementById('sendBackward').onclick = function () {
    sendImageBackward(clickedImageIndex);
    contextMenu.style.display = 'none'; // Hide the menu after action
  };
}

// Hide the context menu when clicking anywhere else on the page
document.addEventListener('click', function () {
  document.getElementById('contextMenu').style.display = 'none';
});


// Send the image to the back (i.e., bottom of the stack)
function sendImageBackward(index) {
  if (index > 0) {
    // Remove the image from its current position
    const imgObj = images.splice(index, 1)[0];

    // Insert it at the beginning of the array (which will send it to the back in rendering order)
    images.unshift(imgObj);

    // Redraw the canvas with the new image order
    draw(true);
  }
}


// 
// 
const theme = document.getElementById('theme');

const themes = {
  dark: {
    color: "#000000", // Dark theme color
    // bg: "url('images/black-bg.jpg')", 
    // Dark theme background image
    iconId: 'darkIcon' // ID of the dark theme icon
  },
  light: {
    color: "#ffffff", // Light theme color
    // bg: "url('images/white-bg.jpg')", 
    // Light theme background image
    iconId: 'lightIcon' // ID of the light theme icon
  }
};

// Function to set the theme icon based on the current theme
function setThemeIcon(iconId) {
  document.querySelectorAll('.icon').forEach(img => {
    img.classList.toggle('hidden', img.id !== iconId);
  });
}

// Initialize theme based on the currently visible icon
function initializeTheme() {
  // Default to light theme
  const defaultTheme = 'light';

  // Set canvas background color and image for the default theme
  canvas.style.backgroundColor = themes[defaultTheme].color;
  canvas.style.backgroundImage = themes[defaultTheme].bg;
  setThemeIcon(themes[defaultTheme].iconId);
}

// Call initializeTheme to set up the initial theme
initializeTheme();

// Handle theme toggling
theme.addEventListener("click", () => {
  // Find the currently visible icon
  const visibleIcon = document.querySelector('.icon:not(.hidden)');
  
  // Determine the current theme based on the visible icon
  const currentThemeKey = Object.keys(themes).find(themeKey => themes[themeKey].iconId === visibleIcon.id);
  
  // Toggle the theme (if dark, switch to light; if light, switch to dark)
  const newThemeKey = currentThemeKey === 'dark' ? 'light' : 'dark';

  // Update the canvas background color and image for the new theme
  canvas.style.backgroundColor = themes[newThemeKey].color;
  canvas.style.backgroundImage = themes[newThemeKey].bg;

  // Set the theme icon accordingly
  setThemeIcon(themes[newThemeKey].iconId);
});



// 
// 
// 
// 
// 


const helpTip = document.getElementById('helpTip');

const instructions = [
  { text: "DragON Canvas\n", font: "bold 36px Arial", fillStyle: "#666" },

  { text: "Drag image(s) from your desktop", fillStyle: "gray" },
  { text: "or a folder, directly onto the canvas.", fillStyle: "gray" },
  { text: "Alternatively use button (top left) to open finder.", fillStyle: "gray" },
  { text: "YOU CAN LOAD MULTIPLE IMAGES AT ONCE\n", font: "bold 24px Arial", fillStyle: "#444" },
  
  { text: "Drag and position images.", font: "bold 24px Arial", fillStyle: "#555" },

  { text: "Hold 'g' key and drag to DRAG ALL images together.", font: "bold 22px Arial", fillStyle: "#333" },

  { text: "SHIFT CLICK images to drag as a group.\n", font: "bold 22px Arial", fillStyle: "#333" },

  { text: "Resize using green dot (bottom right).", fillStyle: "gray" },
  { text: "Use ↑ ↓ Arrow keys to rotate.", fillStyle: "#555" },
  { text: "Backspace/Delete key to remove.\n", fillStyle: "gray" },
  { text: "Right-click an image to send backwards in the stack.", fillStyle: "gray" },
  { text: "Hover move over the 3 icons (top right) for usage tips.\n", font: "bold 24px Arial", fillStyle: "#888" },
  { text: "App Quit/Restart removes all images from canvas.", fillStyle: "gray" },
];

function drawStyledText(context, styledLines, x, y, maxWidth, lineHeight) {
  styledLines.forEach(({ text, font, fillStyle }) => {
    const lines = text.split('\n');
    context.font = font || "24px Arial";
    context.fillStyle = fillStyle || "black";

    lines.forEach(line => {
      const words = line.split(' ');
      let currentLine = '';

      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine + words[n] + ' ';
        const metrics = context.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && n > 0) {
          context.fillText(currentLine.trim(), x, y);
          currentLine = words[n] + ' ';
          y += lineHeight;
        } else {
          currentLine = testLine;
        }
      }
      context.fillText(currentLine.trim(), x, y);
      y += lineHeight;
    });
  });
}

function drawHelpOverlay() {
ctx.save();

  // Semi-transparent background
  ctx.fillStyle = "rgba(255, 255, 255, 1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Text styling
  ctx.textAlign = "center";
  ctx.fillStyle = "white";

  const maxWidth = canvas.width * 0.9;
  const lineHeight = 38;
  const yStart = canvas.height / 4 - (lineHeight * 4);

  drawStyledText(ctx, instructions, canvas.width / 2, yStart, maxWidth, lineHeight);

  ctx.restore();
}











function updateCanvasOffset() {
  const rect = canvas.getBoundingClientRect();
  offsetX = rect.left;
  offsetY = rect.top;
}






function draw(withBorders = false) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (images.length === 0) {
    drawHelpOverlay();
    helpTip.classList.add('hidden');
    return;
  }

  helpTip.classList.remove('hidden');

  images.forEach((imgObj, index) => {
    imgObj.right = imgObj.x + imgObj.width;
    imgObj.bottom = imgObj.y + imgObj.height;
    if (imgObj.rotation === undefined) imgObj.rotation = 0;

    const cx = imgObj.x + imgObj.width / 2;
    const cy = imgObj.y + imgObj.height / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((imgObj.rotation || 0) * Math.PI / 180);
    ctx.drawImage(
      imgObj.img, 0, 0, imgObj.img.width, imgObj.img.height,
      -imgObj.width / 2, -imgObj.height / 2, imgObj.width, imgObj.height
    );
    ctx.restore();
  });

  if (withBorders) {
    // Draw green dots for all selected images except lastSelectedForDot first
    selectedImages.forEach(imgObj => {
      if (imgObj === lastSelectedForDot) return; // skip last one here

      const cx = imgObj.x + imgObj.width / 2;
      const cy = imgObj.y + imgObj.height / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((imgObj.rotation || 0) * Math.PI / 180);

      const cornerX = imgObj.width / 2;
      const cornerY = imgObj.height / 2;
      const cornerRadius = 6;

      ctx.beginPath();
      ctx.arc(cornerX, cornerY, cornerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'green';
      ctx.fill();

      ctx.restore();
    });

    // Now draw the green dot for lastSelectedForDot on top if any
    if (lastSelectedForDot && selectedImages.includes(lastSelectedForDot)) {
      const cx = lastSelectedForDot.x + lastSelectedForDot.width / 2;
      const cy = lastSelectedForDot.y + lastSelectedForDot.height / 2;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((lastSelectedForDot.rotation || 0) * Math.PI / 180);

      const cornerX = lastSelectedForDot.width / 2;
      const cornerY = lastSelectedForDot.height / 2;
      const cornerRadius = 6;

      ctx.beginPath();
      ctx.arc(cornerX, cornerY, cornerRadius, 0, 2 * Math.PI);
      ctx.fillStyle = 'green';
      ctx.fill();

      ctx.restore();
    }
  }

  if (showHelp) {
    drawHelpOverlay(); // overlays instructions on top
  }
}






function toLocalCoordinates(x, y, imgObj) {
  const cx = imgObj.x + imgObj.width / 2;
  const cy = imgObj.y + imgObj.height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const angle = -imgObj.rotation * Math.PI / 180;

  const localX = dx * Math.cos(angle) - dy * Math.sin(angle) + imgObj.width / 2;
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle) + imgObj.height / 2;

  return { localX, localY };
}

function anchorHitTest(x, y) {
  const cornerSize = 10;

  for (let i = 0; i < images.length; i++) {
    const imgObj = images[i];
    const { localX, localY } = toLocalCoordinates(x, y, imgObj);
    const brCorner = { x: imgObj.width, y: imgObj.height };

    if (
      Math.abs(localX - brCorner.x) <= cornerSize &&
      Math.abs(localY - brCorner.y) <= cornerSize
    ) {
      return { index: i, anchor: 2 }; // bottom-right
    }
  }

  return { index: -1, anchor: -1 };
}



function hitImage(x, y) {
  for (let i = images.length - 1; i >= 0; i--) {
    let imgObj = images[i];

    // Convert to local coords relative to the rotated image
    const { localX, localY } = toLocalCoordinates(x, y, imgObj);

    // Check if inside unrotated image bounds
    if (localX >= 0 && localX <= imgObj.width && localY >= 0 && localY <= imgObj.height) {
      return i;
    }
  }
  return -1;
}






function handleMouseDown(e) {
  e.preventDefault();
  e.stopPropagation();

  startX = e.clientX - offsetX;
  startY = e.clientY - offsetY;

  const hitTestResult = anchorHitTest(startX, startY);
  draggingResizer = hitTestResult.anchor;

  let imgIndex = hitTestResult.index !== -1 ? hitTestResult.index : hitImage(startX, startY);
  const imgObj = imgIndex !== -1 ? images[imgIndex] : null;

  if (imgObj) {
    
    if (dragAll) {
      selectedImages = [...images];
      lastSelectedForDot = selectedImages[selectedImages.length - 1];
      isDragging = true;
      draggingImage = -1;
      readyToDrag = true;

      activeImage = images.indexOf(lastSelectedForDot);
    }

    if (shiftHeld) {
      // Toggle selection
      const selectedIdx = selectedImages.indexOf(imgObj);
      if (selectedIdx === -1) {
        selectedImages.push(imgObj);
      } else {
        selectedImages.splice(selectedIdx, 1);
      }

      activeImage = selectedImages.length > 0 ? images.indexOf(selectedImages[selectedImages.length - 1]) : -1;

      activeImage = selectedImages.length > 0 ? images.indexOf(selectedImages[0]) : -1;
      draggingImage = selectedImages.length > 1 ? -1 : images.indexOf(selectedImages[0]);
      readyToDrag = false;
      isDragging = false;

      // Update dot tracking
      if (selectedImages.includes(imgObj)) {
        lastSelectedForDot = imgObj;
      } else if (lastSelectedForDot === imgObj) {
        lastSelectedForDot = selectedImages.length > 0
          ? selectedImages[selectedImages.length - 1]
          : null;
      }

    } else {
      if (selectedImages.includes(imgObj)) {
        // Clicked a selected image
        readyToDrag = true;
        isDragging = false;
        draggingImage = selectedImages.length > 1 ? -1 : images.indexOf(imgObj);
      } else {
        // New single selection
        selectedImages = [imgObj];
        lastSelectedForDot = imgObj;

        // Bring to front
        images.splice(imgIndex, 1);
        images.push(imgObj);

        activeImage = images.length - 1;
        draggingImage = activeImage;
        readyToDrag = true;
        isDragging = false;
      }
    }

  } else {
    // Clicked on empty space – clear all
    selectedImages = [];
    activeImage = -1;
    draggingImage = -1;
    readyToDrag = false;
    isDragging = false;
    lastSelectedForDot = null;
  }

  if (draggingResizer > -1) {
    activeImage = hitTestResult.index;
  }

  prevX = startX;
  prevY = startY;

  draw(true);
}










function handleMouseMove(e) {
  e.preventDefault();
  e.stopPropagation();

  const now = Date.now();
  if (now - lastResizeTime < resizeThrottle) return;
  lastResizeTime = now;

  if (!readyToDrag) return;  // Just check readyToDrag only

  const mouseX = e.clientX - offsetX;
  const mouseY = e.clientY - offsetY;

  // Force start dragging immediately if dragAll is true
  if (dragAll && !isDragging) {
    isDragging = true;
  } else {
    const moveThreshold = 3;
    if (!isDragging) {
      if (Math.abs(mouseX - startX) <= moveThreshold && Math.abs(mouseY - startY) <= moveThreshold) {
        return; // don't drag yet
      }
      isDragging = true;
    }
  }

  // Resize only if activeImage is valid and resizer is active
if (draggingResizer === 2 && activeImage !== -1) {
  const imgObj = images[activeImage];
  const aspectRatio = imgObj.img.width / imgObj.img.height;
  const { localX: lx, localY: ly } = toLocalCoordinates(mouseX, mouseY, imgObj);

  let newWidth = lx;
  let newHeight = ly;

  if (newWidth / newHeight > aspectRatio) {
    newWidth = newHeight * aspectRatio;
  } else {
    newHeight = newWidth / aspectRatio;
  }

  const MIN_IMAGE_SIZE = 25;
  newWidth = Math.max(MIN_IMAGE_SIZE, newWidth);
  newHeight = Math.max(MIN_IMAGE_SIZE, newHeight);


  const scaleX = newWidth / imgObj.width;
  const scaleY = newHeight / imgObj.height;

  const toResize = selectedImages.length > 1 ? selectedImages : [imgObj];

  for (const target of toResize) {
    const cx = target.x + target.width / 2;
    const cy = target.y + target.height / 2;

    target.width = Math.max(MIN_IMAGE_SIZE, target.width * scaleX);
    target.height = Math.max(MIN_IMAGE_SIZE, target.height * scaleY);

    // Re-center
    target.x = cx - target.width / 2;
    target.y = cy - target.height / 2;
  }

  draw(true);
  return;
}


  if (isDragging) {
    const dx = mouseX - prevX;
    const dy = mouseY - prevY;

    if (draggingImage === -1 && selectedImages.length > 1) {
      for (const imgObj of selectedImages) {
        imgObj.x += dx;
        imgObj.y += dy;
      }
    } else if (draggingImage > -1) {
      const imgObj = images[draggingImage];
      imgObj.x += dx;
      imgObj.y += dy;
    }

    prevX = mouseX;
    prevY = mouseY;

    draw(true);
  }
}









function handleMouseUp(e) {
  e.preventDefault();
  e.stopPropagation();

  draggingResizer = -1;
  draggingImage = -1;
  readyToDrag = false;
  isDragging = false;

  draw(true);
}





window.addEventListener('keydown', function(e) {

  if (e.key === 'Shift') {
    shiftHeld = true;
  }

  
// show help instructions
if (e.key.toLowerCase() === 'h') {
    showHelp = !showHelp;
    draw(true);
  }



  // group drag
    if (e.key.toLowerCase() === 'g') {
      dragAll = true;
    }




  // 
  // 
  if (activeImage === -1) return;
  // ^^^ only allow key shortcuts whilst an image is active


 let rotated = false;

  if (e.key === 'ArrowDown') {
    selectedImages.forEach(imgObj => {
      imgObj.rotation = ((imgObj.rotation || 0) - 1) % 360;
    });
    rotated = true;
  } else if (e.key === 'ArrowUp') {
    selectedImages.forEach(imgObj => {
      imgObj.rotation = ((imgObj.rotation || 0) + 1) % 360;
    });
    rotated = true;
  }

  if (rotated) {
    draw(true);
    e.preventDefault();
  }






// delete image with backspace/delete key
  if (e.key === 'Backspace' || e.key === 'Delete') {
    console.log(1);
    const confirmDelete = confirm('Delete selected image(s)?');
    if (confirmDelete) {
      // Sort descending to delete from back
      selectedImages.forEach(imgObj => {
        const i = images.indexOf(imgObj);
        if (i !== -1) {
          images.splice(i, 1);
        }
      });
      selectedImages = [];
      activeImage = -1;
      draggingImage = -1;
      draggingResizer = -1;
      draw(true);
    }
  }

// 
// 
});


  window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
      shiftHeld = false;
    }

    if (e.key.toLowerCase() === 'g') {
      dragAll = false;
    }
  });














// Load images and resize to fit within maxHeight, scattered randomly
document.getElementById('imageLoader').addEventListener('change', function (e) {

  showHelp = false;
  Array.from(e.target.files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();

      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          // Limit image to maxHeight while maintaining aspect ratio
          let width, height;
          let aspectRatio = img.width / img.height;

          if (img.height > maxHeight) {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          } else {
            height = img.height;
            width = img.width;
          }

          img.draggable = false;

          // Calculate the initial center position
          let centerX = canvas.width / 2 - width / 2;
          let centerY = canvas.height / 2 - height / 2;

          // Define a minimum distance between images to prevent overlap
          const minDistance = 100;
          let overlap = true;

          // Adjust position to ensure no overlap and within canvas bounds
          while (overlap) {
            overlap = false;

            // Check boundaries
            if (centerX < 0 || centerX + width > canvas.width ||
                centerY < 0 || centerY + height > canvas.height) {
              centerX = Math.random() * (canvas.width - width);
              centerY = Math.random() * (canvas.height - height);
            }

            // Check if new image overlaps with existing images
            for (let j = 0; j < images.length; j++) {
              const existingImg = images[j];
              if (Math.abs(centerX - existingImg.x) < minDistance &&
                  Math.abs(centerY - existingImg.y) < minDistance) {
                overlap = true;
                centerX = Math.random() * (canvas.width - width);
                centerY = Math.random() * (canvas.height - height);
                break;
              }
            }
          }

          // Create image object
          const imgObj = {
            img: img,
            x: centerX,
            y: centerY,
            width: width,
            height: height,
            right: centerX + width,
            bottom: centerY + height,
            rotation: 0,
          };
          images.push(imgObj);
          draw(false);
        };
        img.src = event.target.result;
      };

      reader.readAsDataURL(file);
    }
  });
});



///*  */
function handleImageDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  showHelp = false;

  const dt = e.dataTransfer;
  const files = dt.files;

  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();

      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          // Limit image maxHeight while maintaining aspect ratio
          let newWidth, newHeight;

          if (img.height > maxHeight) {
            newHeight = maxHeight;
            newWidth = (img.width * maxHeight) / img.height;
          } else {
            newHeight = img.height;
            newWidth = img.width;
          }

          img.draggable = false;

          // Calculate the initial center position
          let centerX = canvas.width / 2 - newWidth / 2;
          let centerY = canvas.height / 2 - newHeight / 2;

          // Define a minimum distance between images to prevent overlap
          const minDistance = 100;
          let overlap = true;

          // Adjust position to ensure no overlap and within canvas bounds
          while (overlap) {
            overlap = false;
            // Check boundaries
            if (centerX < 0 || centerX + newWidth > canvas.width ||
                centerY < 0 || centerY + newHeight > canvas.height) {
              centerX = Math.random() * (canvas.width - newWidth);
              centerY = Math.random() * (canvas.height - newHeight);
            }

            // Check if new image overlaps with existing images
            for (let j = 0; j < images.length; j++) {
              const existingImg = images[j];
              if (Math.abs(centerX - existingImg.x) < minDistance &&
                  Math.abs(centerY - existingImg.y) < minDistance) {
                overlap = true;
                centerX = Math.random() * (canvas.width - newWidth);
                centerY = Math.random() * (canvas.height - newHeight);
                break;
              }
            }
          }

          // Create image object
          const imgObj = {
            img: img,
            x: centerX,
            y: centerY,
            width: newWidth,
            height: newHeight,
            right: centerX + newWidth,
            bottom: centerY + newHeight,
            rotation: 0,
          };
          images.push(imgObj);
          draw(false);
        };
        img.src = evt.target.result;
      };

      reader.readAsDataURL(file);
    }
  });
}


///*  */


canvas.addEventListener("mousedown", handleMouseDown);
canvas.addEventListener("mousemove", handleMouseMove);
canvas.addEventListener("mouseup", handleMouseUp);
canvas.addEventListener("mouseout", handleMouseUp);



canvas.addEventListener("dragover", function(e) {
  e.preventDefault();
  e.stopPropagation();
});
canvas.addEventListener("drop", handleImageDrop);

///*  */



document.getElementById('clearCanvas').addEventListener('click', function () {
  const confirmation = confirm("Are you sure you wish to clear all images?");
  if (confirmation) {
    images.length = 0;
    draw(false); // Redraw canvas without images
  }
});



window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateCanvasOffset();
  draw(false);
});

// Initialize canvas size
window.dispatchEvent(new Event('resize'));



// Function to generate a random name
function generateRandomName() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomName = '';
  for (let i = 0; i < 10; i++) { // Generate a 10 character random string
    randomName += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return randomName;
}


// Set up the download button to capture the canvas and trigger a download
downloadBtn.addEventListener('click', () => {
  // Temporarily redraw without green dot resize guide
  draw(false);

  // Convert canvas to image
  domtoimage.toBlob(canvas)
    .then((blob) => {
      // Generate random filename
      const link = document.createElement('a');
      const randomName = generateRandomName();
      link.href = URL.createObjectURL(blob);
      link.download = `${randomName}-image.png`;
      link.click();
      URL.revokeObjectURL(link.href);

      // Optionally restore borders for UI
      draw(true);
    })
    .catch((error) => {
      console.error('Error generating image:', error);
    });
});
