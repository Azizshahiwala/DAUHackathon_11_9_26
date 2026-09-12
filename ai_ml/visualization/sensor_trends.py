# ============================================================
#                    SENSOR TREND VISUALIZATION
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

DATA_FILE = os.path.join(
    BASE_DIR,
    "data",
    "solar_sensor_data.csv"
)

OUTPUT_DIR = os.path.join(
    BASE_DIR,
    "output"
)


# ============================================================
# DEFAULT ASSET
# ============================================================

DEFAULT_ASSET_ID = "P001"


# ============================================================
# LOAD DATA
# ============================================================

def load_data():

    if not os.path.exists(
        DATA_FILE
    ):
        raise FileNotFoundError(
            f"Sensor data not found:\n"
            f"{DATA_FILE}"
        )

    return pd.read_csv(
        DATA_FILE
    )


# ============================================================
# CREATE SENSOR GRAPHS
# ============================================================

def create_sensor_graphs(
    data,
    asset_id
):

    asset_data = data[
        data["asset_id"]
        == asset_id
    ].copy()

    if len(asset_data) == 0:

        raise ValueError(
            f"Asset '{asset_id}' "
            "was not found."
        )

    asset_data = asset_data.sort_values(
        "reading_id"
    )

    os.makedirs(
        OUTPUT_DIR,
        exist_ok=True
    )

    # ========================================================
    # TEMPERATURE
    # ========================================================

    plt.figure(
        figsize=(12, 6)
    )

    plt.plot(
        asset_data["reading_id"],
        asset_data["temperature"]
    )

    plt.xlabel(
        "Reading ID"
    )

    plt.ylabel(
        "Temperature (°C)"
    )

    plt.title(
        f"Temperature Trend - {asset_id}"
    )

    plt.grid(
        alpha=0.25
    )

    plt.tight_layout()

    temperature_file = os.path.join(
        OUTPUT_DIR,
        f"{asset_id}_temperature.png"
    )

    plt.savefig(
        temperature_file,
        dpi=150
    )

    plt.show()

    # ========================================================
    # VOLTAGE
    # ========================================================

    plt.figure(
        figsize=(12, 6)
    )

    plt.plot(
        asset_data["reading_id"],
        asset_data["voltage"]
    )

    plt.xlabel(
        "Reading ID"
    )

    plt.ylabel(
        "Voltage (V)"
    )

    plt.title(
        f"Voltage Trend - {asset_id}"
    )

    plt.grid(
        alpha=0.25
    )

    plt.tight_layout()

    voltage_file = os.path.join(
        OUTPUT_DIR,
        f"{asset_id}_voltage.png"
    )

    plt.savefig(
        voltage_file,
        dpi=150
    )

    plt.show()

    # ========================================================
    # CURRENT
    # ========================================================

    plt.figure(
        figsize=(12, 6)
    )

    plt.plot(
        asset_data["reading_id"],
        asset_data["current"]
    )

    plt.xlabel(
        "Reading ID"
    )

    plt.ylabel(
        "Current (A)"
    )

    plt.title(
        f"Current Trend - {asset_id}"
    )

    plt.grid(
        alpha=0.25
    )

    plt.tight_layout()

    current_file = os.path.join(
        OUTPUT_DIR,
        f"{asset_id}_current.png"
    )

    plt.savefig(
        current_file,
        dpi=150
    )

    plt.show()

    # ========================================================
    # IRRADIANCE
    # ========================================================

    plt.figure(
        figsize=(12, 6)
    )

    plt.plot(
        asset_data["reading_id"],
        asset_data["irradiance"]
    )

    plt.xlabel(
        "Reading ID"
    )

    plt.ylabel(
        "Irradiance (W/m²)"
    )

    plt.title(
        f"Irradiance Trend - {asset_id}"
    )

    plt.grid(
        alpha=0.25
    )

    plt.tight_layout()

    irradiance_file = os.path.join(
        OUTPUT_DIR,
        f"{asset_id}_irradiance.png"
    )

    plt.savefig(
        irradiance_file,
        dpi=150
    )

    plt.show()

    # ========================================================
    # SOILING
    # ========================================================

    plt.figure(
        figsize=(12, 6)
    )

    plt.plot(
        asset_data["reading_id"],
        asset_data["soiling"]
    )

    plt.xlabel(
        "Reading ID"
    )

    plt.ylabel(
        "Soiling (%)"
    )

    plt.title(
        f"Soiling Trend - {asset_id}"
    )

    plt.grid(
        alpha=0.25
    )

    plt.tight_layout()

    soiling_file = os.path.join(
        OUTPUT_DIR,
        f"{asset_id}_soiling.png"
    )

    plt.savefig(
        soiling_file,
        dpi=150
    )

    plt.show()

    # ========================================================
    # POWER OUTPUT
    # ========================================================

    plt.figure(
        figsize=(12, 6)
    )

    plt.plot(
        asset_data["reading_id"],
        asset_data["power_output"]
    )

    plt.xlabel(
        "Reading ID"
    )

    plt.ylabel(
        "Power Output (W)"
    )

    plt.title(
        f"Power Output Trend - {asset_id}"
    )

    plt.grid(
        alpha=0.25
    )

    plt.tight_layout()

    power_file = os.path.join(
        OUTPUT_DIR,
        f"{asset_id}_power_output.png"
    )

    plt.savefig(
        power_file,
        dpi=150
    )

    plt.show()

    print(
        "\nGraphs saved in:"
    )

    print(
        OUTPUT_DIR
    )


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 60)
    print(
        "SOLAR SENSOR TREND VISUALIZATION"
    )
    print("=" * 60)

    data = load_data()

    print(
        f"\nTotal readings: {len(data)}"
    )

    print(
        f"Selected asset: "
        f"{DEFAULT_ASSET_ID}"
    )

    create_sensor_graphs(
        data,
        DEFAULT_ASSET_ID
    )

    print(
        "\nSensor visualization completed."
    )


if __name__ == "__main__":
    main()