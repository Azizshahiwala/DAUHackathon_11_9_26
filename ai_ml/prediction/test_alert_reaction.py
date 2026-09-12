import json

from prediction.predict import predict_sensor_reading


# ============================================================
# ALERT REACTION SIMULATION
# ============================================================
#
# This script tests how the AI system reacts when the same
# solar asset gradually changes from healthy to degraded.
#
# It DOES NOT modify the trained model.
# It only sends different sensor conditions to predict.py.
# ============================================================


# ============================================================
# TEST SCENARIOS
# ============================================================

TEST_SCENARIOS = [

    {
        "name": "1. NORMAL OPERATION",
        "description": "Healthy solar panel",
        "asset": {
            "asset_id": "TEST-001",
            "temperature": 40,
            "voltage": 39,
            "current": 9,
            "irradiance": 850,
            "soiling": 5,
            "power_output": 351
        }
    },

    {
        "name": "2. EARLY DEGRADATION",
        "description": "Small change in sensor conditions",
        "asset": {
            "asset_id": "TEST-001",
            "temperature": 48,
            "voltage": 37,
            "current": 8,
            "irradiance": 800,
            "soiling": 15,
            "power_output": 296
        }
    },

    {
        "name": "3. MODERATE DEGRADATION",
        "description": "Increasing temperature, soiling and electrical degradation",
        "asset": {
            "asset_id": "TEST-001",
            "temperature": 55,
            "voltage": 35,
            "current": 7,
            "irradiance": 750,
            "soiling": 25,
            "power_output": 245
        }
    },

    {
        "name": "4. HIGH-RISK CONDITION",
        "description": "Multiple sensor values moving outside normal operation",
        "asset": {
            "asset_id": "TEST-001",
            "temperature": 62,
            "voltage": 33,
            "current": 5.5,
            "irradiance": 700,
            "soiling": 32,
            "power_output": 181.5
        }
    },

    {
        "name": "5. CRITICAL CONDITION",
        "description": "Severe degradation requiring urgent inspection",
        "asset": {
            "asset_id": "TEST-001",
            "temperature": 70,
            "voltage": 30,
            "current": 4,
            "irradiance": 650,
            "soiling": 45,
            "power_output": 120
        }
    },

    {
        "name": "6. EXTREME / COMBINED FAULT",
        "description": "Multiple severe sensor abnormalities",
        "asset": {
            "asset_id": "TEST-001",
            "temperature": 78,
            "voltage": 27,
            "current": 2.5,
            "irradiance": 600,
            "soiling": 55,
            "power_output": 67.5
        }
    }
]


# ============================================================
# SAFE VALUE FUNCTION
# ============================================================

def get_value(result, key, default="N/A"):

    value = result.get(key, default)

    if value is None:
        return default

    return value


# ============================================================
# PRINT RESULT
# ============================================================

def print_result(
    scenario_number,
    scenario,
    result
):

    print("\n" + "=" * 75)

    print(
        f"{scenario['name']}"
    )

    print("=" * 75)

    print(
        "Description:",
        scenario["description"]
    )

    print("\nSensor Values:")

    asset = scenario["asset"]

    print(
        f"Temperature : {asset['temperature']} °C"
    )

    print(
        f"Voltage     : {asset['voltage']} V"
    )

    print(
        f"Current     : {asset['current']} A"
    )

    print(
        f"Irradiance  : {asset['irradiance']} W/m²"
    )

    print(
        f"Soiling     : {asset['soiling']} %"
    )

    print(
        f"Power Output: {asset['power_output']} W"
    )

    print("\nAI Response:")

    print(
        "Asset ID:",
        get_value(result, "asset_id")
    )

    print(
        "Status:",
        get_value(result, "status")
    )

    print(
        "Reconstruction Error:",
        get_value(result, "reconstruction_error")
    )

    print(
        "Anomaly Threshold:",
        get_value(result, "anomaly_threshold")
    )

    print(
        "Risk Score:",
        get_value(result, "risk_score")
    )

    print(
        "Risk Level:",
        get_value(result, "risk_level")
    )

    print(
        "Failure Risk:",
        get_value(result, "failure_risk"),
        "%"
    )

    print(
        "Failure Risk Level:",
        get_value(result, "failure_risk_level")
    )

    print(
        "Fault Type:",
        get_value(result, "fault_type")
    )

    print(
        "\nPossible Issues:"
    )

    issues = result.get(
        "possible_issues",
        []
    )

    if issues:

        for issue in issues:

            print(
                " -",
                issue
            )

    else:

        print(
            " - No major sensor issue detected"
        )

    print(
        "\nMaintenance Priority:",
        get_value(
            result,
            "maintenance_priority"
        )
    )

    print(
        "Recommended Action:",
        get_value(
            result,
            "recommended_action"
        )
    )

    print(
        "\nEstimated Energy Loss:",
        get_value(
            result,
            "estimated_energy_loss_kwh"
        ),
        "kWh"
    )

    print(
        "Estimated Revenue Loss:",
        get_value(
            result,
            "estimated_revenue_loss_rs"
        ),
        "Rs"
    )

    # --------------------------------------------------------
    # ALERT DECISION
    # --------------------------------------------------------

    status = str(
        get_value(
            result,
            "status",
            ""
        )
    ).upper()

    priority = str(
        get_value(
            result,
            "maintenance_priority",
            ""
        )
    ).upper()

    if status == "ANOMALY":

        print(
            "\n🚨 ALERT GENERATED"
        )

        print(
            "Reason: Sensor pattern is outside the learned "
            "normal operating pattern."
        )

        print(
            "Maintenance Priority:",
            priority
        )

    else:

        print(
            "\n✓ NO ALERT"
        )

        print(
            "Reason: Sensor pattern is within the "
            "learned normal operating pattern."
        )


# ============================================================
# SUMMARY
# ============================================================

def print_summary(results):

    print("\n\n" + "=" * 75)
    print("ALERT REACTION SUMMARY")
    print("=" * 75)

    print()

    print(
        f"{'Stage':<28}"
        f"{'Status':<12}"
        f"{'Risk':<12}"
        f"{'Priority':<15}"
        f"{'Fault'}"
    )

    print("-" * 75)

    for index, result in enumerate(results):

        scenario_name = TEST_SCENARIOS[index]["name"]

        status = str(
            get_value(
                result,
                "status",
                "N/A"
            )
        )

        risk = str(
            get_value(
                result,
                "risk_level",
                "N/A"
            )
        )

        priority = str(
            get_value(
                result,
                "maintenance_priority",
                "N/A"
            )
        )

        fault = str(
            get_value(
                result,
                "fault_type",
                "N/A"
            )
        )

        print(
            f"{scenario_name:<28}"
            f"{status:<12}"
            f"{risk:<12}"
            f"{priority:<15}"
            f"{fault}"
        )

    print("\n" + "=" * 75)


# ============================================================
# MAIN
# ============================================================

def main():

    print("=" * 75)
    print("SOLAR AI ALERT-REACTION SIMULATION")
    print("=" * 75)

    print(
        "\nPurpose:"
    )

    print(
        "Test how the AI reacts when the same solar asset "
        "gradually changes from normal to critical."
    )

    print(
        "\nNumber of scenarios:",
        len(TEST_SCENARIOS)
    )

    results = []

    # --------------------------------------------------------
    # RUN EACH SCENARIO
    # --------------------------------------------------------

    for index, scenario in enumerate(
        TEST_SCENARIOS,
        start=1
    ):

        try:

            result = predict_sensor_reading(
                scenario["asset"]
            )

            results.append(result)

            print_result(
                index,
                scenario,
                result
            )

        except Exception as error:

            print("\n" + "=" * 75)

            print(
                f"ERROR IN SCENARIO {index}"
            )

            print("=" * 75)

            print(
                "Scenario:",
                scenario["name"]
            )

            print(
                "Error:",
                str(error)
            )

            print(
                "\nThe main prediction system may need "
                "to be checked before continuing."
            )

            return

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    print_summary(
        results
    )

    # --------------------------------------------------------
    # JSON PREVIEW
    # --------------------------------------------------------

    print("\n" + "=" * 75)
    print("JSON ALERT DATA")
    print("=" * 75)

    json_results = []

    for result in results:

        json_results.append(result)

    print(
        json.dumps(
            json_results,
            indent=4,
            default=str
        )
    )

    # --------------------------------------------------------
    # FINAL MESSAGE
    # --------------------------------------------------------

    print("\n" + "=" * 75)
    print("ALERT REACTION SIMULATION COMPLETED")
    print("=" * 75)

    print(
        "\nThe same asset was tested under progressively "
        "worse sensor conditions."
    )

    print(
        "Compare reconstruction error, risk level, "
        "fault type and maintenance priority."
    )


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":
    main()