const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const theme = document.getElementById('theme');

const themes = {
  dark: {
    color: "#202123", // Dark theme color
    iconId: 'darkIcon' // ID of the dark theme icon
  },
  light: {
    color: "#f9f4f1", // Light theme color
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
  // Default to dark theme
  const defaultTheme = 'dark';

  // Set canvas background color and icon for the default theme
  canvas.style.backgroundColor = themes[defaultTheme].color;
  setThemeIcon(themes[defaultTheme].iconId);
}

// Call initializeTheme to set up the initial theme
initializeTheme();

theme.addEventListener("click", () => {
  // Find the currently visible icon
  const visibleIcon = document.querySelector('.icon:not(.hidden)');
  const currentThemeKey = Object.keys(themes).find(themeKey => themes[themeKey].iconId === visibleIcon.id);
  const newThemeKey = currentThemeKey === 'dark' ? 'light' : 'dark';

  // Update the canvas background color and toggle the icons
  canvas.style.backgroundColor = themes[newThemeKey].color;
  setThemeIcon(themes[newThemeKey].iconId);
});


// 
// 
// 
// 
// 

var offsetX, offsetY;
var images = []; // Array to store multiple images
var draggingResizer = -1, draggingImage = -1;
var activeImage = -1;  // Track the active (selected) image
var startX, startY;

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const lines = text.split('\n'); // Split the text by newline character

  lines.forEach(line => {
    let words = line.split(' ');
    let currentLine = '';

    for (let n = 0; n < words.length; n++) {
      const testLine = currentLine + words[n] + ' ';
      const metrics = context.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        context.fillText(currentLine, x, y);
        currentLine = words[n] + ' ';
        y += lineHeight;
      } else {
        currentLine = testLine;
      }
    }
    context.fillText(currentLine, x, y);
    y += lineHeight; // Move to the next line
  });
}


function drawInstructions() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas

  // Set the font and alignment for the instruction text
  ctx.font = "24px Arial";
  ctx.fillStyle = "gray";
  ctx.textAlign = "center";
  // ctx.textBaseline = "middle";

  // Set maximum width for each line and line height
  const maxWidth = canvas.width * 0.9; // 80% of the canvas width
  const lineHeight = 38; // Adjust the space between lines

  // Instruction text with manual line breaks
  const text = "DragON Canvas \n\nDrag images directly onto the canvas. \nOr use button (top left) to load them.\nHighlight file names and press open. \nYou can load multiple images at once. \n\nResize images using the red borders. \nDrag and position images. \n\nPage reload removes all images. \nNo data is shared or stored.";

  // Calculate the starting y position to center the text block vertically
  const y = canvas.height / 3 - (lineHeight * 3);

  // Draw the wrapped text with line breaks
  wrapText(ctx, text, canvas.width / 2, y, maxWidth, lineHeight);
}


function updateCanvasOffset() {
  const rect = canvas.getBoundingClientRect();
  offsetX = rect.left;
  offsetY = rect.top;
}

function draw(withBorders) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (images.length === 0) {
    drawInstructions(); // Draw the instructions if no images are loaded
    return; // Exit the function since there's nothing else to draw
  }
  
  images.forEach((imgObj, index) => {
    ctx.drawImage(imgObj.img, 0, 0, imgObj.img.width, imgObj.img.height, imgObj.x, imgObj.y, imgObj.width, imgObj.height);

    if (withBorders && activeImage === index) {
      drawDeleteButton(imgObj.right + 30, imgObj.y - 30, 'rgba(255, 0, 0, 1)'); // Top-right (Delete button)

      // Draw the red outline first
      ctx.lineWidth = 24; // Set the outline width slightly larger than the white border
      ctx.strokeStyle = 'white'; // Set the outline color to red
      
      ctx.beginPath();
      ctx.moveTo(imgObj.x - 12, imgObj.y - 12); // Offset by 12px for outline width
      ctx.lineTo(imgObj.right + 12, imgObj.y - 12); // Offset by 12px for outline width
      ctx.lineTo(imgObj.right + 12, imgObj.bottom + 12); // Offset by 12px for outline width
      ctx.lineTo(imgObj.x - 12, imgObj.bottom + 12); // Offset by 12px for outline width
      ctx.closePath();
      ctx.stroke();

      // Draw the white border on top of the red outline
      ctx.lineWidth = 20; // Set the border width to 20px
      ctx.strokeStyle = 'red'; // Set the border color to white
      
      ctx.beginPath();
      ctx.moveTo(imgObj.x - 10, imgObj.y - 10); // Offset by 10px for border width
      ctx.lineTo(imgObj.right + 10, imgObj.y - 10); // Offset by 10px for border width
      ctx.lineTo(imgObj.right + 10, imgObj.bottom + 10); // Offset by 10px for border width
      ctx.lineTo(imgObj.x - 10, imgObj.bottom + 10); // Offset by 10px for border width
      ctx.closePath();
      ctx.stroke();
    }

  });
}




function drawDeleteButton(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 10, y - 10, 20, 20); // Draw a red square button

  ctx.strokeStyle = 'white';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 7);
  ctx.lineTo(x + 7, y + 7);
  ctx.moveTo(x + 7, y - 7);
  ctx.lineTo(x - 7, y + 7);
  ctx.stroke(); // Draw an "X" inside the button
}

function anchorHitTest(x, y) {
  for (let i = 0; i < images.length; i++) {
    let imgObj = images[i];
    let dx, dy;

    // Check for delete button hit test
    dx = x - (imgObj.right + 30); // Adjust for 20px border and 10px extra offset
    dy = y - (imgObj.y - 30);     // Adjust for 20px border and 10px extra offset
    if (dx * dx + dy * dy <= 100) return { index: i, anchor: 4 };

    // Adjust for border width (20px)
    dx = x - (imgObj.x - 10);
    dy = y - (imgObj.y - 10);
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 0 };

    dx = x - (imgObj.right + 10);
    dy = y - (imgObj.y - 10);
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 1 };

    dx = x - (imgObj.right + 10);
    dy = y - (imgObj.bottom + 10);
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 2 };

    dx = x - (imgObj.x - 10);
    dy = y - (imgObj.bottom + 10);
    if (dx * dx + dy * dy <= 64) return { index: i, anchor: 3 };
  }

  return { index: -1, anchor: -1 };
}

function hitImage(x, y) {
  for (let i = images.length - 1; i >= 0; i--) { // Reverse loop to prioritize topmost image
    let imgObj = images[i];
    if (x > imgObj.x && x < imgObj.right && y > imgObj.y && y < imgObj.bottom) {
      return i;
    }
  }
  return -1;
}

function handleMouseDown(e) {
  startX = e.clientX - offsetX;
  startY = e.clientY - offsetY;

  let hitTestResult = anchorHitTest(startX, startY);
  draggingResizer = hitTestResult.anchor;

  if (draggingResizer === 4) {
    // Handle deletion of the image if the delete button is clicked
    if (hitTestResult.index !== -1) {
      images.splice(hitTestResult.index, 1); // Remove the image from the array
      draggingResizer = -1;
      draggingImage = -1;
      activeImage = -1;
      draw(false); // Redraw the canvas without the deleted image
    }
  } else {
    // Set the active image based on hit test
    if (hitTestResult.index !== -1) {
      draggingImage = hitTestResult.index;
      activeImage = draggingImage;

      // Bring the clicked image to the front
      let imgObj = images.splice(draggingImage, 1)[0];
      images.push(imgObj);

      // Update activeImage to the new index of the moved image (last in array)
      activeImage = images.length - 1;
    } else {
      // If no image is clicked, deselect any active image
      draggingImage = hitImage(startX, startY);
      if (draggingImage !== -1) {
        activeImage = draggingImage;

        // Bring the clicked image to the front
        let imgObj = images.splice(draggingImage, 1)[0];
        images.push(imgObj);

        // Update activeImage to the new index of the moved image (last in array)
        activeImage = images.length - 1;
      } else {
        activeImage = -1; // Deselect any active image if the canvas or an empty area is clicked
      }
    }
    draw(true); // Redraw the canvas with the new active image at the front
  }
}



function handleMouseUp() {
  if (activeImage > -1) {
    let imgObj = images[activeImage];
    imgObj.right = imgObj.x + imgObj.width;
    imgObj.bottom = imgObj.y + imgObj.height;
    draw(true); // Redraw the canvas after releasing the image
  }

  draggingResizer = -1;
  draggingImage = -1;
  activeImage = -1;
}


function handleMouseMove(e) {
  if (activeImage > -1) {
    let imgObj = images[activeImage];
    let mouseX = e.clientX - offsetX;
    let mouseY = e.clientY - offsetY;

    if (draggingResizer > -1) {
      // Handle resizing logic only for the active image
      let aspectRatio = imgObj.img.width / imgObj.img.height;

      switch (draggingResizer) {
        case 0:
          // Resize from top-left corner
          let newWidthTL = imgObj.right - mouseX;
          let newHeightTL = imgObj.bottom - mouseY;
          imgObj.width = newWidthTL;
          imgObj.height = newHeightTL;
          if (imgObj.width / imgObj.height > aspectRatio) {
            imgObj.width = imgObj.height * aspectRatio;
          } else {
            imgObj.height = imgObj.width / aspectRatio;
          }
          imgObj.x = mouseX;
          imgObj.y = mouseY;
          break;
        case 1:
          // Resize from top-right corner
          imgObj.width = mouseX - imgObj.x;
          imgObj.height = imgObj.bottom - mouseY;
          if (imgObj.width / imgObj.height > aspectRatio) {
            imgObj.width = imgObj.height * aspectRatio;
          } else {
            imgObj.height = imgObj.width / aspectRatio;
          }
          imgObj.y = mouseY;
          break;
        case 2:
          // Resize from bottom-right corner
          imgObj.width = mouseX - imgObj.x;
          imgObj.height = mouseY - imgObj.y;
          if (imgObj.width / imgObj.height > aspectRatio) {
            imgObj.width = imgObj.height * aspectRatio;
          } else {
            imgObj.height = imgObj.width / aspectRatio;
          }
          break;
        case 3:
          // Resize from bottom-left corner
          let newWidthBL = imgObj.right - mouseX;
          let newHeightBL = mouseY - imgObj.y;
          imgObj.width = newWidthBL;
          imgObj.height = newHeightBL;
          if (imgObj.width / imgObj.height > aspectRatio) {
            imgObj.width = imgObj.height * aspectRatio;
          } else {
            imgObj.height = imgObj.width / aspectRatio;
          }
          imgObj.x = mouseX;
          break;
      }

      // Ensure dimensions are at least 25x25
      if (imgObj.width < 25) imgObj.width = 25;
      if (imgObj.height < 25) imgObj.height = 25;

      imgObj.right = imgObj.x + imgObj.width;
      imgObj.bottom = imgObj.y + imgObj.height;

      draw(true);

    } else {
      // Handle dragging logic only for the active image
      let dx = mouseX - startX;
      let dy = mouseY - startY;
      imgObj.x += dx;
      imgObj.y += dy;
      imgObj.right += dx;
      imgObj.bottom += dy;
      startX = mouseX;
      startY = mouseY;

      draw(true);
    }
  }
}


// Load images and resize to fit within 300px height, scattered randomly
document.getElementById('imageLoader').addEventListener('change', function (e) {
  Array.from(e.target.files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();

      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          // Limit image height to 300px while maintaining aspect ratio
          const maxHeight = 300;
          let width, height;
          let aspectRatio = img.width / img.height;

          if (img.height > maxHeight) {
            height = maxHeight;
            width = maxHeight * aspectRatio;
          } else {
            height = img.height;
            width = img.width;
          }

          // Calculate the initial center position
          let centerX = canvas.width / 2 - width / 2;
          let centerY = canvas.height / 2 - height / 2;

          // Define a minimum distance between images to prevent overlap
          const minDistance = 50;
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
            bottom: centerY + height
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

  const dt = e.dataTransfer;
  const files = dt.files;

  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();

      reader.onload = function(evt) {
        const img = new Image();
        img.onload = function() {
          // Limit image height to 300px while maintaining aspect ratio
          const maxHeight = 300;
          let newWidth, newHeight;

          if (img.height > maxHeight) {
            newHeight = maxHeight;
            newWidth = (img.width * maxHeight) / img.height;
          } else {
            newHeight = img.height;
            newWidth = img.width;
          }

          // Calculate the initial center position
          let centerX = canvas.width / 2 - newWidth / 2;
          let centerY = canvas.height / 2 - newHeight / 2;

          // Define a minimum distance between images to prevent overlap
          const minDistance = 50;
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
            bottom: centerY + newHeight
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


//*  */ 
canvas.addEventListener("dragover", function(e) {
  e.preventDefault();
  e.stopPropagation();
});
canvas.addEventListener("drop", handleImageDrop);
///*  */


window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateCanvasOffset();
  draw(false);
});

// Initialize canvas size
window.dispatchEvent(new Event('resize'));
