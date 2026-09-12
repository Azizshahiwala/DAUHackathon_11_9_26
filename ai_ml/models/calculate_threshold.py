import os
import torch
import numpy as np

from preprocessing.dataset import validation_loader
from models.solar_autoencoder import SolarAutoencoder


# ============================================================
# CONFIGURATION
# ============================================================

MODEL_FILE = "models/solar_autoencoder.pth"

THRESHOLD_FILE = "data/threshold.txt"

PERCENTILE = 95


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# LOAD MODEL
# ============================================================

model = SolarAutoencoder()

model.load_state_dict(
    torch.load(
        MODEL_FILE,
        map_location=DEVICE,
        weights_only=True
    )
)

model = model.to(DEVICE)

model.eval()


# ============================================================
# CALCULATE RECONSTRUCTION ERRORS
# ============================================================

errors = []


with torch.no_grad():

    for batch in validation_loader:

        batch = batch.to(DEVICE)

        reconstructed = model(batch)

        batch_errors = torch.mean(
            (
                batch - reconstructed
            ) ** 2,
            dim=1
        )

        errors.extend(
            batch_errors
            .cpu()
            .numpy()
            .tolist()
        )


errors = np.asarray(
    errors,
    dtype=np.float32
)


# ============================================================
# THRESHOLD
# ============================================================

threshold = float(
    np.percentile(
        errors,
        PERCENTILE
    )
)


# ============================================================
# SAVE THRESHOLD
# ============================================================

# Make sure the data directory exists.
os.makedirs(
    os.path.dirname(THRESHOLD_FILE),
    exist_ok=True
)


with open(
    THRESHOLD_FILE,
    "w"
) as file:

    file.write(
        f"{threshold:.6f}"
    )


# ============================================================
# OUTPUT
# ============================================================

print("=" * 70)

print(
    "ANOMALY THRESHOLD CALCULATION"
)

print("=" * 70)


print(
    "\nValidation samples:",
    len(errors)
)


print(
    "\nMinimum error:",
    f"{errors.min():.6f}"
)


print(
    "Maximum error:",
    f"{errors.max():.6f}"
)


print(
    "Mean error:",
    f"{errors.mean():.6f}"
)


print(
    "Median error:",
    f"{np.median(errors):.6f}"
)


print(
    f"\n{PERCENTILE}th percentile:"
)


print(
    f"{threshold:.6f}"
)


print(
    "\nThreshold saved to:"
)


print(
    THRESHOLD_FILE
)


print(
    "\nSaved value:",
    f"{threshold:.6f}"
)


print("\n" + "=" * 70)

print(
    "THRESHOLD CALCULATION COMPLETED"
)

print("=" * 70)