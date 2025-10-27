from backend.video_processor import process_video
from backend.dataset_exporter import DatasetExporter

# process_video("test.mp4", "test_output")
export = DatasetExporter("58548c81-aacd-4fd5-a985-e8d71decc81d", "test_dataset")
# export.prepare_coco8_yaml()
export.export_annotations()