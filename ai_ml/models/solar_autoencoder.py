import torch
import torch.nn as nn


class SolarAutoencoder(
    nn.Module
):

    def __init__(self):

        super().__init__()

        # ----------------------------------------------------
        # ENCODER
        # ----------------------------------------------------

        self.encoder = nn.Sequential(

            nn.Linear(
                6,
                4
            ),

            nn.ReLU(),

            nn.Linear(
                4,
                2
            )
        )

        # ----------------------------------------------------
        # DECODER
        # ----------------------------------------------------

        self.decoder = nn.Sequential(

            nn.Linear(
                2,
                4
            ),

            nn.ReLU(),

            nn.Linear(
                4,
                6
            )
        )

    def forward(
        self,
        x
    ):

        encoded = (
            self.encoder(x)
        )

        decoded = (
            self.decoder(encoded)
        )

        return decoded


# ============================================================
# TEST
# ============================================================

if __name__ == "__main__":

    model = SolarAutoencoder()

    print(model)

    sample = torch.randn(
        32,
        6
    )

    output = model(
        sample
    )

    print(
        "\nInput:",
        sample.shape
    )

    print(
        "Output:",
        output.shape
    )