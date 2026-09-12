import torch
import torch.nn as nn
import torch.optim as optim

from preprocessing.dataset import (
    train_loader
)

from models.solar_autoencoder import (
    SolarAutoencoder
)


# ============================================================
# CONFIGURATION
# ============================================================

EPOCHS = 60

LEARNING_RATE = 0.001

MODEL_FILE = (
    "models/solar_autoencoder.pth"
)


# ============================================================
# DEVICE
# ============================================================

DEVICE = torch.device(
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# MODEL
# ============================================================

model = SolarAutoencoder()

model = model.to(
    DEVICE
)


# ============================================================
# LOSS
# ============================================================

loss_function = nn.MSELoss()


# ============================================================
# OPTIMIZER
# ============================================================

optimizer = optim.Adam(
    model.parameters(),
    lr=LEARNING_RATE
)


# ============================================================
# TRAINING
# ============================================================

print("=" * 70)

print(
    "PYTORCH AUTOENCODER TRAINING"
)

print("=" * 70)

print(
    "\nDevice:",
    DEVICE
)

print(
    "\nEpochs:",
    EPOCHS
)

print(
    "\nLearning rate:",
    LEARNING_RATE
)


for epoch in range(
    EPOCHS
):

    model.train()

    total_loss = 0.0

    for batch in train_loader:

        batch = batch.to(
            DEVICE
        )

        # Forward pass
        reconstructed = model(
            batch
        )

        # Reconstruction loss
        loss = loss_function(
            reconstructed,
            batch
        )

        # Clear gradients
        optimizer.zero_grad()

        # Backpropagation
        loss.backward()

        # Update weights
        optimizer.step()

        total_loss += (
            loss.item()
        )

    average_loss = (
        total_loss
        / len(train_loader)
    )

    print(
        f"Epoch "
        f"[{epoch + 1:02d}/{EPOCHS}] "
        f"Loss: "
        f"{average_loss:.6f}"
    )


# ============================================================
# SAVE MODEL
# ============================================================

torch.save(
    model.state_dict(),
    MODEL_FILE
)


print("\n" + "=" * 70)

print(
    "TRAINING COMPLETED"
)

print("=" * 70)

print(
    "\nModel saved:"
)

print(
    MODEL_FILE
)