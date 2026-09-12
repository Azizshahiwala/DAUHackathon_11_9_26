# ============================================================
#                    TRAINING LOSS GRAPH
# ============================================================

import os

import pandas as pd
import matplotlib.pyplot as plt


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

INPUT_FILE = os.path.join(
    BASE_DIR,
    "output",
    "training_loss.csv"
)

OUTPUT_FILE = os.path.join(
    BASE_DIR,
    "output",
    "training_loss.png"
)


# ============================================================
# CREATE GRAPH
# ============================================================

def create_training_loss_graph():

    if not os.path.exists(
        INPUT_FILE
    ):

        print(
            "\nTraining loss history not found."
        )

        print(
            "\nExpected file:"
        )

        print(
            INPUT_FILE
        )

        print(
            "\nThis file will be created "
            "when training is configured "
            "to save epoch losses."
        )

        return

    data = pd.read_csv(
        INPUT_FILE
    )

    required_columns = [
        "epoch",
        "loss"
    ]

    for column in required_columns:

        if column not in data.columns:

            raise ValueError(
                f"Required column '{column}' "
                "is missing from training_loss.csv."
            )

    os.makedirs(
        os.path.dirname(
            OUTPUT_FILE
        ),
        exist_ok=True
    )

    plt.figure(
        figsize=(12, 6)
    )

    plt.plot(
        data["epoch"],
        data["loss"],
        linewidth=2,
        label="Training Loss"
    )

    plt.xlabel(
        "Epoch"
    )

    plt.ylabel(
        "Reconstruction Loss"
    )

    plt.title(
        "PyTorch Autoencoder Training Loss"
    )

    plt.legend()

    plt.grid(
        alpha=0.25
    )

    plt.tight_layout()

    plt.savefig(
        OUTPUT_FILE,
        dpi=150
    )

    plt.show()

    print(
        "\nTraining loss graph saved to:"
    )

    print(
        OUTPUT_FILE
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print(
        "PYTORCH TRAINING LOSS VISUALIZATION"
    )
    print("=" * 60)

    create_training_loss_graph()