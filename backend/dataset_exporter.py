from typing import Dict, List
import yaml
import os
from backend.database.models import *
import shutil
DB_PATH = "db.sqlite"

class DatasetExporter:
    def __init__(self, project_uuid: str, export_dir: str):
        self.database = DBSession(DB_PATH)
        self.project_uuid = project_uuid
        self.export_dir = export_dir
        self.image_dir = os.path.join(export_dir, 'images')
        self.label_dir = os.path.join(export_dir, 'labels')

    def prepare_coco8_yaml(self) -> Dict:
        """
        Prepare COCO8 YAML format from project data.
        Returns a dictionary with the YAML content.
        """
        project = self.database.get_project_by_uuid(self.project_uuid, user_id=1)
        if not project:
            raise ValueError(f"Project with UUID {self.project_uuid} not found")

        # Get all labels for the project
        labels = self.database.get_project_labels(self.project_uuid)
        label_names = [label.name for label in labels]

        # Create label to index mapping (YOLO format requires numeric indices)
        label_to_idx = {label.name: idx for idx, label in enumerate(labels)}

        # Get all images and their annotations
        images = self.database.get_project_images(self.project_uuid)
        
        # Prepare paths and splits
        train_images = []
        val_images = []
        test_images = []

        # For simplicity, split: 70% train, 20% val, 10% test
        total_images = len(images)
        train_split = int(total_images * 0.7)
        val_split = int(total_images * 0.2)

        for idx, image in enumerate(images):
            image_path = os.path.join(self.image_dir, image.file_path)
            
            # Determine which split this image belongs to
            if idx < train_split:
                train_images.append(image_path)
            elif idx < train_split + val_split:
                val_images.append(image_path)
            else:
                test_images.append(image_path)

        # Prepare YAML content
        yaml_content = {
            'path': self.export_dir,  # Root directory
            'train': train_images,    # Train images
            'val': val_images,        # Val images
            'test': test_images,      # Test images
            
            'names': {                # Label names
                idx: name for idx, name in enumerate(label_names)
            },
            
            'nc': len(labels),        # Number of classes
        }

        return yaml_content

    def export_annotations(self) -> None:
        """
        Export annotations in YOLO format (one .txt file per image).
        Format: <class_id> <x_center> <y_center> <width> <height>
        All values are normalized to [0, 1]
        """
        project = self.database.get_project_by_uuid(self.project_uuid, user_id=1)
        if not project:
            raise ValueError(f"Project with UUID {self.project_uuid} not found")

        # Get label mapping
        labels = self.database.get_project_labels(self.project_uuid, user_id=1)[0]
        print(f"-> Labels: {labels}")
        label_to_idx = {label["name"]: idx for idx, label in enumerate(labels)}

        # Create labels directory if it doesn't exist
        os.makedirs(self.label_dir, exist_ok=True)

        # Get all images and their annotations
        images = self.database.get_project_images(self.project_uuid, user_id=1)
        
        for image in images:
            annotations = self.database.get_image_annotations(image["uuid"])
            
            if len(annotations[0]) == 0:
                continue
            print(f"-> Image: {image}")
            print(f"-> Annotations: {annotations}")

            # copy image to label_dir
            shutil.copy(image["file_path"], self.label_dir)

            # Create annotation file for this image
            # label_file = os.path.join(self.label_dir, f"{os.path.splitext(image['file_path'])[0]}.txt")
            
            # with open(label_file, 'w') as f:
            #     for ann in annotations:
            #         # Convert to YOLO format:
            #         # <class_id> <x_center> <y_center> <width> <height>
            #         class_id = label_to_idx[ann["label"]["name"]]
                    
            #         # Annotations are already in UV format (0-1)
            #         x_center = ann.x + (ann.width / 2)
            #         y_center = ann.y + (ann.height / 2)
                    
            #         # Write YOLO format line
            #         f.write(f"{class_id} {x_center:.6f} {y_center:.6f} {ann.width:.6f} {ann.height:.6f}\n")

    def export_dataset(self) -> str:
        """
        Export the complete dataset:
        1. Create directory structure
        2. Export annotations
        3. Create YAML file
        Returns the path to the YAML file
        """
        # Create directories
        os.makedirs(self.image_dir, exist_ok=True)
        os.makedirs(self.label_dir, exist_ok=True)

        # Export annotations
        self.export_annotations()

        # Create YAML file
        yaml_content = self.prepare_coco8_yaml()
        yaml_path = os.path.join(self.export_dir, 'dataset.yaml')
        
        with open(yaml_path, 'w') as f:
            yaml.dump(yaml_content, f, sort_keys=False)

        return yaml_path 