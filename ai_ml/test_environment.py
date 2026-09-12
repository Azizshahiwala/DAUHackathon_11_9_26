import torch
import numpy as np
import pandas as pd
import matplotlib


print("=" * 50)
print("AI/ML ENVIRONMENT CHECK")
print("=" * 50)

print("PyTorch    :", torch.__version__)
print("NumPy      :", np.__version__)
print("Pandas     :", pd.__version__)
print("Matplotlib :", matplotlib.__version__)

print("\nCUDA available:", torch.cuda.is_available())

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
else:
    print("GPU: Not available")
    print("Training will use CPU.")

print("\nAll libraries imported successfully!")

print("=" * 50)