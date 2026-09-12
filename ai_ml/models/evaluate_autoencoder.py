import torch
import numpy as np

from preprocessing.dataset import validation_loader
from models.solar_autoencoder import SolarAutoencoder


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_FILE = "models/solar_autoencoder.pth"

THRESHOLD_PERCENTILE = 95


# ============================================================
# DEVICE
# ============================================================

device = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ============================================================
# LOAD MODEL
# ============================================================

model = SolarAutoencoder()

model.load_state_dict(
    torch.load(
        MODEL_FILE,
        map_location=device,
        weights_only=True
    )
)

model = model.to(device)

model.eval()


# ============================================================
# CALCULATE RECONSTRUCTION ERRORS
# ============================================================

reconstruction_errors = []


with torch.no_grad():

    for batch in validation_loader:

        batch = batch.to(device)

        reconstructed = model(batch)

        # Calculate error for every sensor reading
        error = torch.mean(
            (batch - reconstructed) ** 2,
            dim=1
        )

        reconstruction_errors.extend(
            error.cpu().numpy()
        )


# Convert to NumPy array

reconstruction_errors = np.array(
    reconstruction_errors
)


# ============================================================
# CALCULATE THRESHOLD
# ============================================================

threshold = np.percentile(
    reconstruction_errors,
    THRESHOLD_PERCENTILE
)


# ============================================================
# STATISTICS
# ============================================================

minimum_error = reconstruction_errors.min()

maximum_error = reconstruction_errors.max()

mean_error = reconstruction_errors.mean()

median_error = np.median(
    reconstruction_errors
)


# ============================================================
# DISPLAY RESULTS
# ============================================================

print("=" * 60)
print("AUTOENCODER VALIDATION")
print("=" * 60)

print("\nValidation samples:")
print(len(reconstruction_errors))

print("\nReconstruction Error Statistics:")

print("\nMinimum error:")
print(f"{minimum_error:.6f}")

print("\nMaximum error:")
print(f"{maximum_error:.6f}")

print("\nMean error:")
print(f"{mean_error:.6f}")

print("\nMedian error:")
print(f"{median_error:.6f}")

print(
    f"\n{THRESHOLD_PERCENTILE}th percentile threshold:"
)

print(f"{threshold:.6f}")


# ============================================================
# COUNT READINGS ABOVE THRESHOLD
# ============================================================

anomalies = reconstruction_errors >= threshold

anomaly_count = np.sum(anomalies)

normal_count = len(reconstruction_errors) - anomaly_count


print("\n" + "=" * 60)
print("THRESHOLD ANALYSIS")
print("=" * 60)

print("\nNormal readings:")
print(normal_count)

print("\nReadings above threshold:")
print(anomaly_count)

print(
    "\nPercentage above threshold:"
)

print(
    f"{(anomaly_count / len(reconstruction_errors)) * 100:.2f}%"
)


print("\n" + "=" * 60)
print("VALIDATION COMPLETED")
print("=" * 60)