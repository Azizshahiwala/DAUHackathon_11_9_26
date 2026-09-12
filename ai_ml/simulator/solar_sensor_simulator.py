import os
import sys
import random
from pathlib import Path
import pandas as pd

AI_ML_DIR = Path(__file__).resolve().parent.parent
if str(AI_ML_DIR) not in sys.path:
    sys.path.insert(0, str(AI_ML_DIR))

# ============================================================
# CONFIGURATION
# ============================================================

NUM_ASSETS = 100
READINGS_PER_ASSET = 200

OUTPUT_FILE = str(AI_ML_DIR / "data" / "solar_sensor_data.csv")

RANDOM_SEED = 42

random.seed(RANDOM_SEED)


# ============================================================
# NORMAL SENSOR READING
# ============================================================

def generate_normal_reading():

    temperature = random.uniform(25, 50)

    voltage = random.uniform(37, 42)

    current = random.uniform(7, 10)

    irradiance = random.uniform(500, 1000)

    soiling = random.uniform(0, 10)

    power_output = voltage * current

    return {
        "temperature": temperature,
        "voltage": voltage,
        "current": current,
        "irradiance": irradiance,
        "soiling": soiling,
        "power_output": power_output,
        "condition": "normal",
        "fault_type": "none"
    }


# ============================================================
# SOILING FAULT
# ============================================================

def generate_soiling_fault():

    temperature = random.uniform(30, 55)

    voltage = random.uniform(34, 40)

    current = random.uniform(4, 7)

    irradiance = random.uniform(500, 1000)

    soiling = random.uniform(30, 70)

    power_output = voltage * current

    return {
        "temperature": temperature,
        "voltage": voltage,
        "current": current,
        "irradiance": irradiance,
        "soiling": soiling,
        "power_output": power_output,
        "condition": "abnormal",
        "fault_type": "soiling"
    }


# ============================================================
# OVERHEATING FAULT
# ============================================================

def generate_overheating_fault():

    temperature = random.uniform(65, 90)

    voltage = random.uniform(32, 38)

    current = random.uniform(5, 8)

    irradiance = random.uniform(600, 1000)

    soiling = random.uniform(0, 15)

    power_output = voltage * current

    return {
        "temperature": temperature,
        "voltage": voltage,
        "current": current,
        "irradiance": irradiance,
        "soiling": soiling,
        "power_output": power_output,
        "condition": "abnormal",
        "fault_type": "overheating"
    }


# ============================================================
# LOW VOLTAGE FAULT
# ============================================================

def generate_low_voltage_fault():

    temperature = random.uniform(30, 60)

    voltage = random.uniform(25, 33)

    current = random.uniform(6, 9)

    irradiance = random.uniform(500, 1000)

    soiling = random.uniform(0, 15)

    power_output = voltage * current

    return {
        "temperature": temperature,
        "voltage": voltage,
        "current": current,
        "irradiance": irradiance,
        "soiling": soiling,
        "power_output": power_output,
        "condition": "abnormal",
        "fault_type": "low_voltage"
    }


# ============================================================
# LOW CURRENT FAULT
# ============================================================

def generate_low_current_fault():

    temperature = random.uniform(30, 55)

    voltage = random.uniform(36, 42)

    current = random.uniform(2, 5)

    irradiance = random.uniform(600, 1000)

    soiling = random.uniform(0, 15)

    power_output = voltage * current

    return {
        "temperature": temperature,
        "voltage": voltage,
        "current": current,
        "irradiance": irradiance,
        "soiling": soiling,
        "power_output": power_output,
        "condition": "abnormal",
        "fault_type": "low_current"
    }


# ============================================================
# PARTIAL SHADING
# ============================================================

def generate_partial_shading_fault():

    temperature = random.uniform(25, 50)

    voltage = random.uniform(30, 38)

    current = random.uniform(4, 7)

    irradiance = random.uniform(500, 1000)

    soiling = random.uniform(0, 15)

    power_output = voltage * current

    return {
        "temperature": temperature,
        "voltage": voltage,
        "current": current,
        "irradiance": irradiance,
        "soiling": soiling,
        "power_output": power_output,
        "condition": "abnormal",
        "fault_type": "partial_shading"
    }


# ============================================================
# POWER DEGRADATION
# ============================================================

def generate_power_degradation_fault():

    temperature = random.uniform(30, 55)

    voltage = random.uniform(32, 37)

    current = random.uniform(4, 7)

    irradiance = random.uniform(600, 1000)

    soiling = random.uniform(5, 20)

    power_output = voltage * current

    return {
        "temperature": temperature,
        "voltage": voltage,
        "current": current,
        "irradiance": irradiance,
        "soiling": soiling,
        "power_output": power_output,
        "condition": "abnormal",
        "fault_type": "power_degradation"
    }


# ============================================================
# COMBINED FAULT
# ============================================================

def generate_combined_fault():

    temperature = random.uniform(65, 90)

    voltage = random.uniform(25, 34)

    current = random.uniform(2, 5)

    irradiance = random.uniform(600, 1000)

    soiling = random.uniform(30, 70)

    power_output = voltage * current

    return {
        "temperature": temperature,
        "voltage": voltage,
        "current": current,
        "irradiance": irradiance,
        "soiling": soiling,
        "power_output": power_output,
        "condition": "abnormal",
        "fault_type": "combined"
    }


# ============================================================
# GRADUAL DEGRADATION
# ============================================================

def generate_degradation_reading(severity):

    temperature = random.uniform(
        35 + severity * 10,
        50 + severity * 20
    )

    voltage = random.uniform(
        40 - severity * 8,
        42 - severity * 5
    )

    current = random.uniform(
        9 - severity * 5,
        10 - severity * 4
    )

    irradiance = random.uniform(600, 1000)

    soiling = random.uniform(
        severity * 20,
        severity * 40
    )

    power_output = voltage * current

    return {
        "temperature": temperature,
        "voltage": voltage,
        "current": current,
        "irradiance": irradiance,
        "soiling": soiling,
        "power_output": power_output,
        "condition": "abnormal",
        "fault_type": "gradual_degradation"
    }


# ============================================================
# SELECT FAULT
# ============================================================

def generate_fault():

    fault_generators = [
        generate_soiling_fault,
        generate_overheating_fault,
        generate_low_voltage_fault,
        generate_low_current_fault,
        generate_partial_shading_fault,
        generate_power_degradation_fault,
        generate_combined_fault
    ]

    generator = random.choice(
        fault_generators
    )

    return generator()


# ============================================================
# GENERATE DATASET
# ============================================================

def generate_dataset():

    records = []

    for asset_number in range(
        1,
        NUM_ASSETS + 1
    ):

        asset_id = f"P{asset_number:03d}"

        degradation_start = random.randint(
            120,
            180
        )

        for reading_number in range(
            1,
            READINGS_PER_ASSET + 1
        ):

            random_value = random.random()

            # ------------------------------------------------
            # NORMAL
            # ------------------------------------------------

            if random_value < 0.75:

                reading = (
                    generate_normal_reading()
                )

            # ------------------------------------------------
            # GRADUAL DEGRADATION
            # ------------------------------------------------

            elif (
                reading_number
                >= degradation_start
                and random_value < 0.85
            ):

                severity = (
                    reading_number
                    - degradation_start
                ) / (
                    READINGS_PER_ASSET
                    - degradation_start
                )

                reading = (
                    generate_degradation_reading(
                        severity
                    )
                )

            # ------------------------------------------------
            # OTHER FAULTS
            # ------------------------------------------------

            else:

                reading = (
                    generate_fault()
                )

            reading["asset_id"] = asset_id

            reading["reading_id"] = (
                reading_number
            )

            records.append(reading)

    dataframe = pd.DataFrame(records)

    dataframe = dataframe[
        [
            "asset_id",
            "reading_id",
            "temperature",
            "voltage",
            "current",
            "irradiance",
            "soiling",
            "power_output",
            "condition",
            "fault_type"
        ]
    ]

    os.makedirs(
        "data",
        exist_ok=True
    )

    dataframe.to_csv(
        OUTPUT_FILE,
        index=False
    )

    print("=" * 70)

    print(
        "REALISTIC SOLAR SENSOR DATA GENERATED"
    )

    print("=" * 70)

    print(
        "\nAssets:",
        NUM_ASSETS
    )

    print(
        "Readings per asset:",
        READINGS_PER_ASSET
    )

    print(
        "Total readings:",
        len(dataframe)
    )

    print(
        "\nCondition distribution:"
    )

    print(
        dataframe[
            "condition"
        ].value_counts()
    )

    print(
        "\nFault distribution:"
    )

    print(
        dataframe[
            "fault_type"
        ].value_counts()
    )

    print(
        "\nSaved to:",
        OUTPUT_FILE
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    generate_dataset()