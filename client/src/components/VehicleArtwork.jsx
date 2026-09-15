import PropTypes from "prop-types";

const figmaCardAssetPattern =
  /^\/assets\/vehicles\/(audi-q8|audi-rs7|bmw-m3|bmw-x5|mercedes-benz-glc|tesla-model-y|toyota-camry)\.png(?:[?#].*)?$/;

const VehicleArtwork = ({
  src,
  alt,
  className = "",
  imageClassName = "",
  fit = "auto",
  loading = "lazy",
}) => {
  const isFigmaCardAsset = figmaCardAssetPattern.test(src || "");
  const shouldCropFigmaCard = fit === "auto" && isFigmaCardAsset;
  const fitClassName =
    fit === "cover" || shouldCropFigmaCard
      ? `h-full w-full object-cover ${
          shouldCropFigmaCard ? "object-top" : "object-center"
        }`
      : "h-full w-full object-contain object-center";

  return (
    <div
      className={`relative overflow-hidden bg-[#f3f3f3] ${className}`}
      data-figma-car-asset={isFigmaCardAsset || undefined}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={`${fitClassName} ${imageClassName}`}
        />
      ) : (
        <span className="flex h-full items-center justify-center text-xs text-slate-500">
          Image unavailable
        </span>
      )}
    </div>
  );
};

VehicleArtwork.propTypes = {
  src: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  imageClassName: PropTypes.string,
  fit: PropTypes.oneOf(["auto", "contain", "cover"]),
  loading: PropTypes.oneOf(["eager", "lazy"]),
};

export default VehicleArtwork;
