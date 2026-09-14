export class imgtool {

  //---------------------------------------------------------//
  // Remueve espacios en blaco en los extremos de una imagen //
  removeImageBlanks(imageObject) {

    return new Promise((res, rej) => {

    const img = new Image();
    img.src = imageObject;

    img.addEventListener("load", (e) => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      var canvas:any = document.createElement('canvas');
      // canvas.setAttribute("width", imgWidth);
      // canvas.setAttribute("height", imgHeight);
      canvas.width = imgWidth;  // newX
      canvas.height = imgHeight;  // newY
      var context:any = canvas.getContext('2d');

      context.drawImage(img, 0, 0);

      var imageData = context.getImageData(0, 0, imgWidth, imgHeight),
        data = imageData.data,
        getRBG = function(x, y) {
            var offset = imgWidth * y + x;
            return {
                red:     data[offset * 4],
                green:   data[offset * 4 + 1],
                blue:    data[offset * 4 + 2],
                opacity: data[offset * 4 + 3]
            };
        },
        isWhite = function (rgb) {
            // many images contain noise, as the white is not a pure #fff white
            return rgb.red > 200 && rgb.green > 200 && rgb.blue > 200;
        },
        scanY = function (fromTop) {
            var offset = fromTop ? 1 : -1;

            // loop through each row
            for(var y = fromTop ? 0 : imgHeight - 1; fromTop ? (y < imgHeight) : (y > -1); y += offset) {

                // loop through each column
                for(var x = 0; x < imgWidth; x++) {
                    var rgb = getRBG(x, y);
                    if (!isWhite(rgb)) {
                        if (fromTop) {
                            return y;
                        } else {
                            return Math.min(y + 1, imgHeight);
                        }
                    }
                }
            }
            return null; // all image is white
        },
        scanX = function (fromLeft) {
            var offset = fromLeft? 1 : -1;

            // loop through each column
            for(var x = fromLeft ? 0 : imgWidth - 1; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {

                // loop through each row
                for(var y = 0; y < imgHeight; y++) {
                    var rgb = getRBG(x, y);
                    if (!isWhite(rgb)) {
                        if (fromLeft) {
                            return x;
                        } else {
                            return Math.min(x + 1, imgWidth);
                        }
                    }      
                }
            }
            return null; // all image is white
        };

        var cropTop:any = scanY(true),
            cropBottom:any = scanY(false),
            cropLeft:any = scanX(true),
            cropRight:any = scanX(false),
            cropWidth:any = cropRight, // - cropLeft,
            cropHeight:any = cropBottom; // - cropTop;

        canvas.setAttribute("width", cropWidth.toString());
        canvas.setAttribute("height", cropHeight.toString());
        // finally crop the guy
        canvas.getContext("2d").drawImage(img,
            cropLeft, cropTop, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight);

        res(canvas.toDataURL());

      });

      img.onerror = error => rej(error);

    });

  }

  //---------------------------------------------------------//
  //      Zoom sobre la imagen con el roll del mouse         //
  zoomImageRollMouse(imageObject) {
    var scale = 1,
        panning = false,
        pointX = 0,
        pointY = 0,
        start = { x: 0, y: 0 },
        zoom = imageObject; 

      function setTransform() {
        zoom.style.transform = "translate(" + pointX + "px, " + pointY + "px) scale(" + scale + ")";
      }

      zoom.onmousedown = function (e) {
        e.preventDefault();
        start = { x: e.clientX - pointX, y: e.clientY - pointY };
        panning = true;
      }

      zoom.onmouseup = function (e) {
        panning = false;
      }

      zoom.onmousemove = function (e) {
        e.preventDefault();
        if (!panning) {
          return;
        }
        pointX = (e.clientX - start.x);
        pointY = (e.clientY - start.y); 
        setTransform();
      }

      zoom.addEventListener('mousewheel', (e: WheelEvent) => {
        e.preventDefault();
        /*var xs = (e.clientX - pointX) / scale,
          ys = (e.clientY - pointY) / scale,
          delta = (e.deltaY ? e.deltaY : -e.deltaY);
        (delta > 0) ? (scale *= 1.2) : (scale /= 1.2);
        pointX = e.clientX - xs * scale;
        pointY = e.clientY - ys * scale;

        setTransform();*/
        scale += e.deltaY * -0.001;

        // Restrict scale
        scale = Math.min(Math.max(.125, scale), 4);

        // Apply scale transform
        zoom.style.transform = `scale(${scale})`;

      });
  }

}