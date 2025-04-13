const cloudinary = require("cloudinary");
const fs = require("fs");

exports.uploadSingle = async (postImage, folderName) => {
  const result = await cloudinary.v2.uploader.upload(postImage, {
    folder: `Thesis/${folderName}`,
  });

  fs.unlink(postImage, (err) => {
    if (err) {
      console.error("Failed to delete local file:", err);
    } else {
      console.log("Successfully deleted local file");
    }
  });

  return {
    public_id: result.public_id,
    url: result.secure_url,
  };
};

exports.uploadMultiple = async (postImages, folderName) => {
  let images = [];
  for (let i = 0; i < postImages.length; i++) {
    let image = postImages[i].path;

    const result = await cloudinary.v2.uploader.upload(image, {
      folder: `Thesis/${folderName}`,
    });
    console.log(postImages[i].originalname);
    images.push({
      public_id: result.public_id,
      url: result.secure_url,
    });

    fs.unlink(image, (err) => {
      if (err) {
        console.error("Failed to delete local file:", err);
      } else {
        console.log("Successfully deleted local file");
      }
    });
  }

  return images;
};

exports.destroyUploaded = (imagePublicId) => {
  cloudinary.v2.uploader.destroy(imagePublicId);
  return { del: true };
};
