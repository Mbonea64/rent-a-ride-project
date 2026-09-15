export const getVehicleImage = (vehicle) => {
  if (!vehicle) return "";

  const imageCandidates = [
    vehicle.image,
    vehicle.images,
    vehicle.imageUrl,
    vehicle.image_url,
    vehicle.public_url,
    vehicle.thumbnail,
  ];

  for (const candidate of imageCandidates) {
    if (Array.isArray(candidate)) {
      const image = candidate.find(Boolean);
      if (image) return image;
    }

    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  const relationalImage = vehicle.vehicle_images?.find(
    (image) => image?.public_url || image?.storage_path
  );

  return relationalImage?.public_url || relationalImage?.storage_path || "";
};
