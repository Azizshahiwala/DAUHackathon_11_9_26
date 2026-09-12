import torch

from torch.utils.data import Dataset
from torch.utils.data import DataLoader


import os
import sys
from pathlib import Path

AI_ML_DIR = Path(__file__).resolve().parent.parent
if str(AI_ML_DIR) not in sys.path:
    sys.path.insert(0, str(AI_ML_DIR))

# ============================================================
# FILES
# ============================================================

TRAIN_FILE = str(AI_ML_DIR / "data" / "train_data.pt")
VALIDATION_FILE = str(AI_ML_DIR / "data" / "validation_data.pt")
TEST_FILE = str(AI_ML_DIR / "data" / "test_data.pt")


# ============================================================
# BATCH SIZE
# ============================================================

BATCH_SIZE = 64


# ============================================================
# DATASET
# ============================================================

class SolarSensorDataset(
    Dataset
):

    def __init__(
        self,
        file_path
    ):

        dataset = torch.load(
            file_path,
            weights_only=False
        )

        self.data = dataset[
            "data"
        ]

    def __len__(self):

        return len(
            self.data
        )

    def __getitem__(
        self,
        index
    ):

        return self.data[
            index
        ]


# ============================================================
# DATASETS
# ============================================================

train_dataset = (
    SolarSensorDataset(
        TRAIN_FILE
    )
)

validation_dataset = (
    SolarSensorDataset(
        VALIDATION_FILE
    )
)

test_dataset = (
    SolarSensorDataset(
        TEST_FILE
    )
)


# ============================================================
# DATALOADERS
# ============================================================

train_loader = DataLoader(
    train_dataset,
    batch_size=BATCH_SIZE,
    shuffle=True
)

validation_loader = DataLoader(
    validation_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False
)

test_loader = DataLoader(
    test_dataset,
    batch_size=BATCH_SIZE,
    shuffle=False
)


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    print("=" * 70)

    print(
        "PYTORCH DATASET / DATALOADER"
    )

    print("=" * 70)

    print(
        "\nTraining samples:",
        len(train_dataset)
    )

    print(
        "Validation samples:",
        len(validation_dataset)
    )

    print(
        "Test samples:",
        len(test_dataset)
    )

    print(
        "\nBatch size:",
        BATCH_SIZE
    )

    batch = next(
        iter(train_loader)
    )

    print(
        "\nFirst batch shape:",
        batch.shape
    )

    print(
        "\nTraining batches:",
        len(train_loader)
    )

    print(
        "\nDataset/DataLoader working!"
    )