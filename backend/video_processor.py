import cv2
import os
from typing import List, Optional
from datetime import datetime

class VideoProcessor:
    def __init__(self, video_path: str, output_dir: str):
        """
        Initialize the video processor.
        Args:
            video_path: Path to the input video file
            output_dir: Directory where frames will be saved
        """
        self.video_path = video_path
        self.output_dir = output_dir
        self.cap = None
        
        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

    def __enter__(self):
        """Context manager entry"""
        self.cap = cv2.VideoCapture(self.video_path)
        if not self.cap.isOpened():
            raise ValueError(f"Could not open video file: {self.video_path}")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        if self.cap:
            self.cap.release()

    def get_video_info(self) -> dict:
        """
        Get basic information about the video.
        Returns:
            Dictionary containing video properties
        """
        if not self.cap:
            raise ValueError("Video capture not initialized")

        return {
            'frame_count': int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            'fps': self.cap.get(cv2.CAP_PROP_FPS),
            'width': int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height': int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'duration': int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT) / self.cap.get(cv2.CAP_PROP_FPS))
        }

    def extract_frames(self, max_frames: Optional[int] = None, frame_interval: int = 1) -> List[str]:
        """
        Extract frames from the video.
        Args:
            max_frames: Maximum number of frames to extract (None for all frames)
            frame_interval: Extract every nth frame (1 for every frame)
        Returns:
            List of paths to the extracted frame images
        """
        if not self.cap:
            raise ValueError("Video capture not initialized")

        frame_paths = []
        frame_count = 0
        total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Generate timestamp for this batch
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        while True:
            ret, frame = self.cap.read()
            if not ret:  # End of video
                break

            # Skip frames based on interval
            if frame_count % frame_interval != 0:
                frame_count += 1
                continue

            # Check if we've reached the maximum number of frames
            if max_frames and len(frame_paths) >= max_frames:
                break

            # Generate frame filename
            frame_filename = f"frame_{timestamp}_{frame_count:06d}.jpg"
            frame_path = os.path.join(self.output_dir, frame_filename)

            # Save frame as JPEG
            cv2.imwrite(frame_path, frame)
            frame_paths.append(frame_path)

            frame_count += 1

            # Optional: yield progress
            if frame_count % 100 == 0:
                progress = (frame_count / total_frames) * 100
                print(f"Processing: {progress:.1f}% complete")

        return frame_paths

    @staticmethod
    def get_frame_dimensions(frame_path: str) -> tuple:
        """
        Get the dimensions of a frame.
        Args:
            frame_path: Path to the frame image
        Returns:
            Tuple of (width, height)
        """
        img = cv2.imread(frame_path)
        if img is None:
            raise ValueError(f"Could not read image: {frame_path}")
        return img.shape[1], img.shape[0]  # OpenCV returns (height, width, channels)

def process_video(video_path: str, output_dir: str, max_frames: Optional[int] = None, frame_interval: int = 1) -> List[str]:
    """
    Convenience function to process a video file.
    Args:
        video_path: Path to the input video file
        output_dir: Directory where frames will be saved
        max_frames: Maximum number of frames to extract (None for all frames)
        frame_interval: Extract every nth frame (1 for every frame)
    Returns:
        List of paths to the extracted frame images
    """
    with VideoProcessor(video_path, output_dir) as processor:
        video_info = processor.get_video_info()
        print(f"Processing video: {os.path.basename(video_path)}")
        print(f"Video info: {video_info}")
        
        frame_paths = processor.extract_frames(max_frames, frame_interval)
        print(f"Extracted {len(frame_paths)} frames")
        
        return frame_paths 