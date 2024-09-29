import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function App() {
  const [selectionType, setSelectionType] = useState('point');
  const [comments, setComments] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentSelection, setCurrentSelection] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const imageRef = useRef(null);

  const apiUrl = 'https://doccem.free.beeceptor.com/comments';

  const getImageDimensions = () => {
    if (imageRef.current) {
      return {
        width: imageRef.current.offsetWidth,
        height: imageRef.current.offsetHeight,
      };
    }
    return { width: 0, height: 0 };
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        setComments(data);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [apiUrl]);

  const handleImageClick = (e) => {
    if (selectionType === 'point') {
      const rect = e.target.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      addComment({ type: 'point', x, y });
    }
  };

  const handleMouseDown = (e) => {
    if (selectionType === 'box') {
      e.preventDefault();
      setIsSelecting(true);
      const rect = e.target.getBoundingClientRect();
      setStartPos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isSelecting && selectionType === 'box') {
      e.preventDefault();
      const rect = e.target.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;

      setCurrentSelection({
        type: 'box',
        x: startPos.x,
        y: startPos.y,
        width: Math.abs(x - startPos.x),
        height: Math.abs(y - startPos.y),
        directionX: x < startPos.x ? 'left' : 'right',
        directionY: y < startPos.y ? 'up' : 'down',
      });
    }
  };

  const handleMouseUp = (e) => {
    if (selectionType === 'box' && currentSelection) {
      e.preventDefault();
      setIsSelecting(false);

      const finalizedSelection = {
        type: 'box',
        x:
          currentSelection.directionX === 'left'
            ? currentSelection.x - currentSelection.width
            : currentSelection.x,
        y:
          currentSelection.directionY === 'up'
            ? currentSelection.y - currentSelection.height
            : currentSelection.y,
        width: currentSelection.width,
        height: currentSelection.height,
      };

      addComment(finalizedSelection);
      setCurrentSelection(null);
    }
  };

  const addComment = (selection) => {
    const comment = prompt('Enter your comment:');
    if (comment) {
      setComments([
        ...comments,
        { id: comments.length + 1, selection, comment },
      ]);
    }
  };

  const calculateScaledPosition = (selection) => {
    const { width, height } = getImageDimensions();
    return {
      x: selection.x * width,
      y: selection.y * height,
      width: selection.width ? selection.width * width : 0,
      height: selection.height ? selection.height * height : 0,
    };
  };

  useEffect(() => {
    const handleResize = () => {
      setComments([...comments]);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [comments]);

  const handleLogComments = () => {
    console.log(JSON.stringify(comments, null, 2));
  };

  const handleRemoveComment = (id) => {
    setComments(comments.filter((comment) => comment.id !== id));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setImageFile(file);
    }
  };

  return (
    <div className="container">
      <h1 className="mt-4">Image Comment App</h1>

      <div className="mb-3">
        <label className="mr-3">
          <input
            type="radio"
            name="selectionType"
            value="point"
            checked={selectionType === 'point'}
            onChange={(e) => setSelectionType(e.target.value)}
          />
          Point
        </label>
        <label className="mr-3">
          <input
            type="radio"
            name="selectionType"
            value="box"
            checked={selectionType === 'box'}
            onChange={(e) => setSelectionType(e.target.value)}
          />
          Box
        </label>
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="mb-3"
      />

      {imageUrl && (
        <div
          style={{ position: 'relative', display: 'inline-block' }}
          onClick={selectionType === 'point' ? handleImageClick : null}
          onMouseDown={selectionType === 'box' ? handleMouseDown : null}
          onMouseMove={isSelecting ? handleMouseMove : null}
          onMouseUp={isSelecting ? handleMouseUp : null}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Annotatable"
            style={{ maxWidth: '100%', height: 'auto' }}
            onMouseDown={(e) => e.preventDefault()}
          />

          {currentSelection && currentSelection.type === 'box' && (
            <div
              style={{
                position: 'absolute',
                border: '2px dashed red',
                left:
                  currentSelection.directionX === 'left'
                    ? `${(currentSelection.x - currentSelection.width) * 100}%`
                    : `${currentSelection.x * 100}%`,
                top:
                  currentSelection.directionY === 'up'
                    ? `${(currentSelection.y - currentSelection.height) * 100}%`
                    : `${currentSelection.y * 100}%`,
                width: `${currentSelection.width * 100}%`,
                height: `${currentSelection.height * 100}%`,
                pointerEvents: 'none',
              }}
            ></div>
          )}

          {comments.map((comment, index) => {
            const scaledPosition = calculateScaledPosition(comment.selection);
            return (
              <div
                key={index}
                style={{
                  position: 'absolute',
                  left: `${
                    (scaledPosition.x / getImageDimensions().width) * 100
                  }%`,
                  top: `${
                    (scaledPosition.y / getImageDimensions().height) * 100
                  }%`,
                  border:
                    comment.selection.type === 'box'
                      ? '1px solid blue'
                      : '5px solid red',
                  width:
                    comment.selection.type === 'box'
                      ? `${
                          (scaledPosition.width / getImageDimensions().width) *
                          100
                        }%`
                      : 0,
                  height:
                    comment.selection.type === 'box'
                      ? `${
                          (scaledPosition.height /
                            getImageDimensions().height) *
                          100
                        }%`
                      : 0,
                  padding: '2px',
                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                  pointerEvents: 'none',
                }}
              >
                <strong
                  onClick={() => handleRemoveComment(comment.id)}
                  style={{ cursor: 'pointer' }}
                >
                  ID {comment.id}
                </strong>
              </div>
            );
          })}
        </div>
      )}

      <button className="btn btn-primary mt-3" onClick={handleLogComments}>
        Log Comments
      </button>

      <div className="mt-4">
        <h2>Comments</h2>
        <ul className="list-group">
          {comments.map((comment) => (
            <li key={comment.id} className="list-group-item">
              <strong
                onClick={() => handleRemoveComment(comment.id)}
                style={{ cursor: 'pointer' }}
              >
                ID {comment.id}:
              </strong>{' '}
              {comment.comment} ({comment.selection.type})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

console.log('Hello console');
